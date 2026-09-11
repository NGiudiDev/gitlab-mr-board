// 2. Dependencias externas.
import { afterEach, describe, expect, it } from 'vitest';

import { createTestDatabase } from '../../../../test/auth.js';
// 6. Imports relativos restantes.
import { createAccountRepository } from '../../accounts/services/accountRepository.js';
import { createAuthRepository } from './authRepository.js';

const ACCOUNT_ID = 'cuenta-1';
const OTHER_ACCOUNT_ID = 'cuenta-2';

const openRepositories = [];

/**
 * Abre una base aislada con dos cuentas ya dadas de alta y registra el
 * repositorio para cerrarlo al terminar el test.
 *
 * Las cuentas van primero porque `users.account_id` es una clave foránea: sin
 * ellas no se puede insertar ningún usuario.
 */
async function openRepository() {
  const database = await createTestDatabase();
  const accounts = createAccountRepository(database);

  await accounts.insert({
    id: ACCOUNT_ID,
    name: 'Equipo de prueba',
    inviteCode: 'CODIGOUNO2',
    createdAt: '2026-09-01T10:00:00.000Z',
  });
  await accounts.insert({
    id: OTHER_ACCOUNT_ID,
    name: 'Otro equipo',
    inviteCode: 'CODIGODOS3',
    createdAt: '2026-09-01T10:00:00.000Z',
  });

  const repository = createAuthRepository(database);
  openRepositories.push(repository);

  return repository;
}

function buildUser(overrides = {}) {
  return {
    id: 'usuario-1',
    accountId: ACCOUNT_ID,
    username: 'ana',
    displayName: 'Ana Prueba',
    passwordHash: 'scrypt$16384$8$1$aa$bb',
    role: 'user',
    status: 'active',
    gitlabUsername: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    lastLoginAt: null,
    ...overrides,
  };
}

function buildSession(overrides = {}) {
  return {
    id: 'sesion-1',
    userId: 'usuario-1',
    tokenHash: 'hash-1',
    createdAt: '2026-09-01T10:00:00.000Z',
    expiresAt: '2026-09-08T10:00:00.000Z',
    ...overrides,
  };
}

afterEach(async () => {
  while (openRepositories.length > 0) await openRepositories.pop()?.close();
});

describe('usuarios', () => {
  it('guarda y recupera un usuario por id y por nombre', async () => {
    const repository = await openRepository();
    const user = buildUser({ gitlabUsername: 'ana-gitlab' });

    await repository.insertUser(user);

    expect(await repository.findUserById(user.id)).toEqual(user);
    expect(await repository.findUserByUsername(user.username)).toEqual(user);
  });

  it('devuelve null cuando el usuario no existe', async () => {
    const repository = await openRepository();

    expect(await repository.findUserById('desconocido')).toBeNull();
    expect(await repository.findUserByUsername('desconocido')).toBeNull();
  });

  it('rechaza dos usuarios con el mismo nombre, incluso en cuentas distintas', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await expect(repository.insertUser(buildUser({ id: 'usuario-2' }))).rejects.toThrow();
    await expect(repository.insertUser(buildUser({ id: 'usuario-3', accountId: OTHER_ACCOUNT_ID })))
      .rejects.toThrow();
  });

  it('rechaza un usuario de una cuenta que no existe', async () => {
    const repository = await openRepository();

    await expect(repository.insertUser(buildUser({ accountId: 'cuenta-inexistente' })))
      .rejects.toThrow();
  });

  it('rechaza un rol o un estado fuera del contrato', async () => {
    const repository = await openRepository();

    await expect(repository.insertUser(buildUser({ role: 'root' })))
      .rejects.toThrow();
    await expect(repository.insertUser(buildUser({ status: 'raro' })))
      .rejects.toThrow();
  });

  it('lista sólo los usuarios de una cuenta, ordenados por nombre', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser({ id: 'usuario-2', username: 'zoe' }));
    await repository.insertUser(buildUser());
    await repository.insertUser(buildUser({
      id: 'usuario-3',
      username: 'beto',
      accountId: OTHER_ACCOUNT_ID,
    }));

    const users = await repository.listUsersOfAccount(ACCOUNT_ID);

    expect(users.map((user) => user.username)).toEqual(['ana', 'zoe']);
  });

  it('lista todos los usuarios de la base para la línea de comandos', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());
    await repository.insertUser(buildUser({
      id: 'usuario-2',
      username: 'beto',
      accountId: OTHER_ACCOUNT_ID,
    }));

    expect((await repository.listAllUsers()).map((user) => user.username)).toEqual(['ana', 'beto']);
  });

  it('actualiza el último ingreso y la contraseña', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await repository.updateLastLogin('usuario-1', '2026-09-02T08:00:00.000Z');
    await repository.updatePasswordHash('usuario-1', 'scrypt$16384$8$1$cc$dd');

    const stored = await repository.findUserById('usuario-1');
    expect(stored?.lastLoginAt).toBe('2026-09-02T08:00:00.000Z');
    expect(stored?.passwordHash).toBe('scrypt$16384$8$1$cc$dd');
  });

  it('actualiza el nombre visible y el identificador del usuario', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await repository.updateProfile('usuario-1', 'anita', 'Ana Pérez');

    expect(await repository.findUserByUsername('ana')).toBeNull();
    expect(await repository.findUserById('usuario-1')).toMatchObject({
      username: 'anita',
      displayName: 'Ana Pérez',
    });
  });

  it('cambia el estado del usuario', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await repository.updateStatus('usuario-1', 'disabled');

    expect((await repository.findUserById('usuario-1'))?.status).toBe('disabled');
  });

  it('guarda y limpia el nickname de GitLab del usuario', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await repository.updateGitlabUsername('usuario-1', 'ana-gitlab');
    expect((await repository.findUserById('usuario-1'))?.gitlabUsername).toBe('ana-gitlab');

    await repository.updateGitlabUsername('usuario-1', null);
    expect((await repository.findUserById('usuario-1'))?.gitlabUsername).toBeNull();
  });

  it('conserva la marca temporal aunque Postgres la guarde con zona horaria', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser({ createdAt: '2026-09-01T10:00:00.000Z' }));

    expect((await repository.findUserById('usuario-1'))?.createdAt)
      .toBe('2026-09-01T10:00:00.000Z');
  });
});

describe('sesiones', () => {
  it('guarda y recupera una sesión por el hash del token', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());
    const session = buildSession();

    await repository.insertSession(session);

    expect(await repository.findSessionByTokenHash('hash-1')).toEqual(session);
    expect(await repository.findSessionByTokenHash('hash-inexistente')).toBeNull();
  });

  it('rechaza una sesión de un usuario que no existe', async () => {
    const repository = await openRepository();

    await expect(repository.insertSession(buildSession())).rejects.toThrow();
  });

  it('borra una sesión puntual y todas las de un usuario', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());
    await repository.insertSession(buildSession());
    await repository.insertSession(buildSession({ id: 'sesion-2', tokenHash: 'hash-2' }));

    await repository.deleteSession('sesion-1');
    expect(await repository.findSessionByTokenHash('hash-1')).toBeNull();
    expect(await repository.findSessionByTokenHash('hash-2')).not.toBeNull();

    await repository.deleteSessionsOfUser('usuario-1');
    expect(await repository.findSessionByTokenHash('hash-2')).toBeNull();
  });

  it('borra sólo las sesiones vencidas e informa cuántas eliminó', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());
    await repository.insertSession(buildSession({ expiresAt: '2026-09-01T09:00:00.000Z' }));
    await repository.insertSession(buildSession({
      id: 'sesion-2',
      tokenHash: 'hash-2',
      expiresAt: '2026-09-30T09:00:00.000Z',
    }));

    const deleted = await repository.deleteExpiredSessions('2026-09-02T00:00:00.000Z');

    expect(deleted).toBe(1);
    expect(await repository.findSessionByTokenHash('hash-1')).toBeNull();
    expect(await repository.findSessionByTokenHash('hash-2')).not.toBeNull();
  });
});

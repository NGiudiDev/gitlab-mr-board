// 2. Dependencias externas.
import { afterEach, describe, expect, it } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthRepository, StoredSession, StoredUser } from '../types.js';

// 7. Imports relativos restantes.
import { createTestRepository } from '../../test/auth.js';

const openRepositories: AuthRepository[] = [];

/** Abre una base aislada y la registra para cerrarla al terminar el test. */
async function openRepository(): Promise<AuthRepository> {
  const repository = await createTestRepository();
  openRepositories.push(repository);

  return repository;
}

function buildUser(overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    id: 'usuario-1',
    username: 'ana',
    displayName: 'Ana Prueba',
    passwordHash: 'scrypt$16384$8$1$aa$bb',
    role: 'user',
    status: 'active',
    createdAt: '2026-09-01T10:00:00.000Z',
    lastLoginAt: null,
    ...overrides,
  };
}

function buildSession(overrides: Partial<StoredSession> = {}): StoredSession {
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
    const user = buildUser();

    await repository.insertUser(user);

    expect(await repository.findUserById(user.id)).toEqual(user);
    expect(await repository.findUserByUsername(user.username)).toEqual(user);
  });

  it('devuelve null cuando el usuario no existe', async () => {
    const repository = await openRepository();

    expect(await repository.findUserById('desconocido')).toBeNull();
    expect(await repository.findUserByUsername('desconocido')).toBeNull();
  });

  it('rechaza dos usuarios con el mismo nombre', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await expect(repository.insertUser(buildUser({ id: 'usuario-2' }))).rejects.toThrow();
  });

  it('rechaza un rol o un estado fuera del contrato', async () => {
    const repository = await openRepository();

    await expect(repository.insertUser(buildUser({ role: 'root' as StoredUser['role'] })))
      .rejects.toThrow();
    await expect(repository.insertUser(buildUser({ status: 'raro' as StoredUser['status'] })))
      .rejects.toThrow();
  });

  it('lista los usuarios ordenados por nombre y los cuenta', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser({ id: 'usuario-2', username: 'zoe' }));
    await repository.insertUser(buildUser());

    const users = await repository.listUsers();

    expect(users.map((user) => user.username)).toEqual(['ana', 'zoe']);
    expect(await repository.countUsers()).toBe(2);
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

  it('cambia el estado del usuario', async () => {
    const repository = await openRepository();
    await repository.insertUser(buildUser());

    await repository.updateStatus('usuario-1', 'disabled');

    expect((await repository.findUserById('usuario-1'))?.status).toBe('disabled');
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

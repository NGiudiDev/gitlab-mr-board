// 2. Dependencias externas.
import { afterEach, describe, expect, it } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthRepository, StoredSession, StoredUser } from '../types.js';

// 7. Imports relativos restantes.
import { IN_MEMORY_LOCATION, openAuthDatabase } from './authRepository.js';

const openRepositories: AuthRepository[] = [];

/** Abre una base aislada y la registra para cerrarla al terminar el test. */
function openRepository(): AuthRepository {
  const repository = openAuthDatabase(IN_MEMORY_LOCATION);
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

afterEach(() => {
  while (openRepositories.length > 0) openRepositories.pop()?.close();
});

describe('usuarios', () => {
  it('guarda y recupera un usuario por id y por nombre', () => {
    const repository = openRepository();
    const user = buildUser();

    repository.insertUser(user);

    expect(repository.findUserById(user.id)).toEqual(user);
    expect(repository.findUserByUsername(user.username)).toEqual(user);
  });

  it('devuelve null cuando el usuario no existe', () => {
    const repository = openRepository();

    expect(repository.findUserById('desconocido')).toBeNull();
    expect(repository.findUserByUsername('desconocido')).toBeNull();
  });

  it('rechaza dos usuarios con el mismo nombre', () => {
    const repository = openRepository();
    repository.insertUser(buildUser());

    expect(() => repository.insertUser(buildUser({ id: 'usuario-2' }))).toThrow();
  });

  it('rechaza un rol o un estado fuera del contrato', () => {
    const repository = openRepository();

    expect(() => repository.insertUser(buildUser({ role: 'root' as StoredUser['role'] }))).toThrow();
    expect(() => repository.insertUser(buildUser({ status: 'raro' as StoredUser['status'] }))).toThrow();
  });

  it('lista los usuarios ordenados por nombre y los cuenta', () => {
    const repository = openRepository();
    repository.insertUser(buildUser({ id: 'usuario-2', username: 'zoe' }));
    repository.insertUser(buildUser());

    expect(repository.listUsers().map((user) => user.username)).toEqual(['ana', 'zoe']);
    expect(repository.countUsers()).toBe(2);
  });

  it('actualiza el último ingreso y la contraseña', () => {
    const repository = openRepository();
    repository.insertUser(buildUser());

    repository.updateLastLogin('usuario-1', '2026-09-02T08:00:00.000Z');
    repository.updatePasswordHash('usuario-1', 'scrypt$16384$8$1$cc$dd');

    const stored = repository.findUserById('usuario-1');
    expect(stored?.lastLoginAt).toBe('2026-09-02T08:00:00.000Z');
    expect(stored?.passwordHash).toBe('scrypt$16384$8$1$cc$dd');
  });

  it('cambia el estado del usuario', () => {
    const repository = openRepository();
    repository.insertUser(buildUser());

    repository.updateStatus('usuario-1', 'disabled');

    expect(repository.findUserById('usuario-1')?.status).toBe('disabled');
  });
});

describe('sesiones', () => {
  it('guarda y recupera una sesión por el hash del token', () => {
    const repository = openRepository();
    repository.insertUser(buildUser());
    const session = buildSession();

    repository.insertSession(session);

    expect(repository.findSessionByTokenHash('hash-1')).toEqual(session);
    expect(repository.findSessionByTokenHash('hash-inexistente')).toBeNull();
  });

  it('rechaza una sesión de un usuario que no existe', () => {
    const repository = openRepository();

    expect(() => repository.insertSession(buildSession())).toThrow();
  });

  it('borra una sesión puntual y todas las de un usuario', () => {
    const repository = openRepository();
    repository.insertUser(buildUser());
    repository.insertSession(buildSession());
    repository.insertSession(buildSession({ id: 'sesion-2', tokenHash: 'hash-2' }));

    repository.deleteSession('sesion-1');
    expect(repository.findSessionByTokenHash('hash-1')).toBeNull();
    expect(repository.findSessionByTokenHash('hash-2')).not.toBeNull();

    repository.deleteSessionsOfUser('usuario-1');
    expect(repository.findSessionByTokenHash('hash-2')).toBeNull();
  });

  it('borra sólo las sesiones vencidas e informa cuántas eliminó', () => {
    const repository = openRepository();
    repository.insertUser(buildUser());
    repository.insertSession(buildSession({ expiresAt: '2026-09-01T09:00:00.000Z' }));
    repository.insertSession(buildSession({
      id: 'sesion-2',
      tokenHash: 'hash-2',
      expiresAt: '2026-09-30T09:00:00.000Z',
    }));

    const deleted = repository.deleteExpiredSessions('2026-09-02T00:00:00.000Z');

    expect(deleted).toBe(1);
    expect(repository.findSessionByTokenHash('hash-1')).toBeNull();
    expect(repository.findSessionByTokenHash('hash-2')).not.toBeNull();
  });
});

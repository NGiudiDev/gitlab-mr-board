// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthRepository, StoredSession, StoredUser, UserRole, UserStatus } from '../types.js';
import type { DatabaseSync } from 'node:sqlite';

// 7. Imports relativos restantes.
import { openDatabase } from './database.js';

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: string;
  created_at: string;
  status: string;
  last_login_at: string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
}

/** Traduce una fila de `users` al contrato del dominio. */
function toStoredUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

/** Traduce una fila de `sessions` al contrato del dominio. */
function toStoredSession(row: SessionRow): StoredSession {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

/**
 * Arma el acceso a usuarios y sesiones sobre una conexión ya abierta.
 *
 * @param database Conexión devuelta por `openDatabase`.
 * @returns Repositorio con sentencias preparadas y listo para usar.
 */
function createAuthRepository(database: DatabaseSync): AuthRepository {
  const insertUserStatement = database.prepare(
    `INSERT INTO users (id, username, display_name, password_hash, role, status, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const findUserByIdStatement = database.prepare('SELECT * FROM users WHERE id = ?');
  const findUserByUsernameStatement = database.prepare('SELECT * FROM users WHERE username = ?');
  const listUsersStatement = database.prepare('SELECT * FROM users ORDER BY username');
  const countUsersStatement = database.prepare('SELECT COUNT(*) AS total FROM users');
  const updateLastLoginStatement = database.prepare('UPDATE users SET last_login_at = ? WHERE id = ?');
  const updatePasswordStatement = database.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  const updateStatusStatement = database.prepare('UPDATE users SET status = ? WHERE id = ?');

  const insertSessionStatement = database.prepare(
    'INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
  );
  const findSessionStatement = database.prepare('SELECT * FROM sessions WHERE token_hash = ?');
  const deleteSessionStatement = database.prepare('DELETE FROM sessions WHERE id = ?');
  const deleteUserSessionsStatement = database.prepare('DELETE FROM sessions WHERE user_id = ?');
  const deleteExpiredSessionsStatement = database.prepare('DELETE FROM sessions WHERE expires_at <= ?');

  return {
    insertUser(user: StoredUser): void {
      insertUserStatement.run(
        user.id,
        user.username,
        user.displayName,
        user.passwordHash,
        user.role,
        user.status,
        user.createdAt,
        user.lastLoginAt,
      );
    },

    findUserById(id: string): StoredUser | null {
      const row = findUserByIdStatement.get(id) as unknown as UserRow | undefined;
      return row ? toStoredUser(row) : null;
    },

    findUserByUsername(username: string): StoredUser | null {
      const row = findUserByUsernameStatement.get(username) as unknown as UserRow | undefined;
      return row ? toStoredUser(row) : null;
    },

    listUsers(): StoredUser[] {
      return (listUsersStatement.all() as unknown as UserRow[]).map(toStoredUser);
    },

    countUsers(): number {
      const row = countUsersStatement.get() as unknown as { total: number } | undefined;
      return row?.total ?? 0;
    },

    updateLastLogin(userId: string, lastLoginAt: string): void {
      updateLastLoginStatement.run(lastLoginAt, userId);
    },

    updatePasswordHash(userId: string, passwordHash: string): void {
      updatePasswordStatement.run(passwordHash, userId);
    },

    updateStatus(userId: string, status: UserStatus): void {
      updateStatusStatement.run(status, userId);
    },

    insertSession(session: StoredSession): void {
      insertSessionStatement.run(
        session.id,
        session.userId,
        session.tokenHash,
        session.createdAt,
        session.expiresAt,
      );
    },

    findSessionByTokenHash(tokenHash: string): StoredSession | null {
      const row = findSessionStatement.get(tokenHash) as unknown as SessionRow | undefined;
      return row ? toStoredSession(row) : null;
    },

    deleteSession(sessionId: string): void {
      deleteSessionStatement.run(sessionId);
    },

    deleteSessionsOfUser(userId: string): void {
      deleteUserSessionsStatement.run(userId);
    },

    deleteExpiredSessions(nowIso: string): number {
      return Number(deleteExpiredSessionsStatement.run(nowIso).changes);
    },

    close(): void {
      database.close();
    },
  };
}

/**
 * Abre la base configurada y devuelve sólo el repositorio de autenticación.
 *
 * Atajo para la línea de comandos y los test, que no necesitan compartir la
 * conexión con los demás repositorios.
 *
 * @param location Ruta del archivo, o `:memory:` para los test.
 * @returns Repositorio de usuarios y sesiones.
 */
function openAuthDatabase(location: string): AuthRepository {
  return createAuthRepository(openDatabase(location));
}

export { createAuthRepository, openAuthDatabase };

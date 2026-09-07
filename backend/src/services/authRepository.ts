// 1. Módulos estándar de Node.js.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthRepository, StoredSession, StoredUser, UserRole, UserStatus } from '../types.js';

const IN_MEMORY_LOCATION = ':memory:';

// El esquema se aplica en cada arranque: `IF NOT EXISTS` lo vuelve idempotente
// y evita sumar una herramienta de migraciones para dos tablas.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`;

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
 * Crea el directorio contenedor de la base para que el primer arranque no
 * falle en una instalación limpia.
 *
 * @param location Ruta del archivo SQLite, o `:memory:`.
 */
function ensureDirectory(location: string): void {
  if (location === IN_MEMORY_LOCATION) return;

  mkdirSync(path.dirname(path.resolve(location)), { recursive: true });
}

/**
 * Abre la base SQLite local y devuelve el acceso a usuarios y sesiones.
 *
 * @param location Ruta del archivo, o `:memory:` para los test.
 * @returns Repositorio con sentencias preparadas y listo para usar.
 * @throws {Error} Si el archivo no se puede abrir o el esquema no se aplica.
 */
function openAuthDatabase(location: string): AuthRepository {
  ensureDirectory(location);

  const database = new DatabaseSync(location);

  // `ON DELETE CASCADE` sólo actúa con las claves foráneas habilitadas, y SQLite
  // las deja apagadas por compatibilidad.
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(SCHEMA);

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

export { IN_MEMORY_LOCATION, openAuthDatabase };

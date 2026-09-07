// 4. Imports exclusivos de tipos de TypeScript.
import type {
  AuthRepository,
  Database,
  StoredSession,
  StoredUser,
  UserRole,
  UserStatus,
} from '../types.js';

// 7. Imports relativos restantes.
import { toIsoString } from './database.js';

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: string;
  created_at: Date | string;
  status: string;
  last_login_at: Date | string | null;
}

interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: Date | string;
  expires_at: Date | string;
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
    createdAt: toIsoString(row.created_at),
    lastLoginAt: row.last_login_at === null ? null : toIsoString(row.last_login_at),
  };
}

/** Traduce una fila de `sessions` al contrato del dominio. */
function toStoredSession(row: SessionRow): StoredSession {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: toIsoString(row.created_at),
    expiresAt: toIsoString(row.expires_at),
  };
}

/**
 * Arma el acceso a usuarios y sesiones sobre una base ya abierta.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en
 * memoria para los test.
 * @returns Repositorio listo para usar.
 */
function createAuthRepository(database: Database): AuthRepository {
  return {
    async insertUser(user: StoredUser): Promise<void> {
      await database.query(
        `INSERT INTO users (id, username, display_name, password_hash, role, status, created_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          user.username,
          user.displayName,
          user.passwordHash,
          user.role,
          user.status,
          user.createdAt,
          user.lastLoginAt,
        ],
      );
    },

    async findUserById(id: string): Promise<StoredUser | null> {
      const { rows } = await database.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);

      return rows[0] ? toStoredUser(rows[0]) : null;
    },

    async findUserByUsername(username: string): Promise<StoredUser | null> {
      const { rows } = await database.query<UserRow>(
        'SELECT * FROM users WHERE username = $1',
        [username],
      );

      return rows[0] ? toStoredUser(rows[0]) : null;
    },

    async listUsers(): Promise<StoredUser[]> {
      const { rows } = await database.query<UserRow>('SELECT * FROM users ORDER BY username');

      return rows.map(toStoredUser);
    },

    async countUsers(): Promise<number> {
      const { rows } = await database.query<{ total: string | number }>(
        'SELECT COUNT(*) AS total FROM users',
      );

      // Postgres devuelve `bigint` para COUNT y el driver lo entrega como texto
      // para no perder precisión.
      return Number(rows[0]?.total ?? 0);
    },

    async updateLastLogin(userId: string, lastLoginAt: string): Promise<void> {
      await database.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [lastLoginAt, userId]);
    },

    async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
      await database.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    },

    async updateStatus(userId: string, status: UserStatus): Promise<void> {
      await database.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
    },

    async deleteUser(userId: string): Promise<boolean> {
      const { rowCount } = await database.query('DELETE FROM users WHERE id = $1', [userId]);

      return rowCount > 0;
    },

    async insertSession(session: StoredSession): Promise<void> {
      await database.query(
        'INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [session.id, session.userId, session.tokenHash, session.createdAt, session.expiresAt],
      );
    },

    async findSessionByTokenHash(tokenHash: string): Promise<StoredSession | null> {
      const { rows } = await database.query<SessionRow>(
        'SELECT * FROM sessions WHERE token_hash = $1',
        [tokenHash],
      );

      return rows[0] ? toStoredSession(rows[0]) : null;
    },

    async deleteSession(sessionId: string): Promise<void> {
      await database.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    },

    async deleteSessionsOfUser(userId: string): Promise<void> {
      await database.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    },

    async deleteExpiredSessions(nowIso: string): Promise<number> {
      const { rowCount } = await database.query('DELETE FROM sessions WHERE expires_at <= $1', [nowIso]);

      return rowCount;
    },

    close: () => database.close(),
  };
}

export { createAuthRepository };

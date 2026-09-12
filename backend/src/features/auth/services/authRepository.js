// 6. Imports relativos restantes.
import { toIsoString } from '../../../shared/database.js';

const SELECT_USER = 'SELECT * FROM users';

/** Traduce una fila de `users` al contrato del dominio. */
function toStoredUser(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    gitlabUsername: row.gitlab_username,
    createdAt: toIsoString(row.created_at),
    lastLoginAt: row.last_login_at === null ? null : toIsoString(row.last_login_at),
  };
}

/** Traduce una fila de `sessions` al contrato del dominio. */
function toStoredSession(row) {
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
function createAuthRepository(database) {
  return {
    async insertUser(user) {
      await database.query(
        `INSERT INTO users (id, account_id, email, display_name, password_hash, role, status, gitlab_username, created_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          user.id,
          user.accountId,
          user.email,
          user.displayName,
          user.passwordHash,
          user.role,
          user.status,
          user.gitlabUsername,
          user.createdAt,
          user.lastLoginAt,
        ],
      );
    },

    async findUserById(id) {
      const { rows } = await database.query(`${SELECT_USER} WHERE id = $1`, [id]);

      return rows[0] ? toStoredUser(rows[0]) : null;
    },

    async findUserByEmail(email) {
      const { rows } = await database.query(
        `${SELECT_USER} WHERE email = $1`,
        [email],
      );

      return rows[0] ? toStoredUser(rows[0]) : null;
    },

    async listUsersOfAccount(accountId) {
      const { rows } = await database.query(
        `${SELECT_USER} WHERE account_id = $1 ORDER BY email`,
        [accountId],
      );

      return rows.map(toStoredUser);
    },

    async listAllUsers() {
      const { rows } = await database.query(`${SELECT_USER} ORDER BY email`);

      return rows.map(toStoredUser);
    },

    async updateLastLogin(userId, lastLoginAt) {
      await database.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [lastLoginAt, userId]);
    },

    async updatePasswordHash(userId, passwordHash) {
      await database.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    },

    async updateProfile(userId, email, displayName) {
      await database.query(
        'UPDATE users SET email = $1, display_name = $2 WHERE id = $3',
        [email, displayName, userId],
      );
    },

    async updateStatus(userId, status) {
      await database.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
    },

    async updateGitlabUsername(userId, gitlabUsername) {
      await database.query('UPDATE users SET gitlab_username = $1 WHERE id = $2', [gitlabUsername, userId]);
    },

    async deleteUser(userId) {
      const { rowCount } = await database.query('DELETE FROM users WHERE id = $1', [userId]);

      return rowCount > 0;
    },

    async insertSession(session) {
      await database.query(
        'INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [session.id, session.userId, session.tokenHash, session.createdAt, session.expiresAt],
      );
    },

    async findSessionByTokenHash(tokenHash) {
      const { rows } = await database.query(
        'SELECT * FROM sessions WHERE token_hash = $1',
        [tokenHash],
      );

      return rows[0] ? toStoredSession(rows[0]) : null;
    },

    async deleteSession(sessionId) {
      await database.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    },

    async deleteSessionsOfUser(userId) {
      await database.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    },

    async deleteExpiredSessions(nowIso) {
      const { rowCount } = await database.query('DELETE FROM sessions WHERE expires_at <= $1', [nowIso]);

      return rowCount;
    },

    close: () => database.close(),
  };
}

export { createAuthRepository };

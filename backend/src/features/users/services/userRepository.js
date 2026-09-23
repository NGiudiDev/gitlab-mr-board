import { toIsoString } from "../../../shared/database.js";

const SELECT_USER = "SELECT * FROM users";

/** Traduce una fila de `users` al contrato interno del dominio. */
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

/**
 * Arma el acceso a usuarios sobre una base ya abierta.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en
 * memoria para los test.
 * @returns Repositorio de usuarios listo para usar.
 */
function createUserRepository(database) {
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
      const { rows } = await database.query(`${SELECT_USER} WHERE email = $1`, [email]);

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
      await database.query("UPDATE users SET last_login_at = $1 WHERE id = $2", [lastLoginAt, userId]);
    },

    async updatePasswordHash(userId, passwordHash) {
      await database.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
    },

    async updateProfile(userId, email, displayName) {
      await database.query(
        "UPDATE users SET email = $1, display_name = $2 WHERE id = $3",
        [email, displayName, userId],
      );
    },

    async updateStatus(userId, status) {
      await database.query("UPDATE users SET status = $1 WHERE id = $2", [status, userId]);
    },

    async updateGitlabUsername(userId, gitlabUsername) {
      await database.query(
        "UPDATE users SET gitlab_username = $1 WHERE id = $2",
        [gitlabUsername, userId],
      );
    },

    async deleteUser(userId) {
      const { rowCount } = await database.query("DELETE FROM users WHERE id = $1", [userId]);

      return rowCount > 0;
    },
  };
}

export { createUserRepository };

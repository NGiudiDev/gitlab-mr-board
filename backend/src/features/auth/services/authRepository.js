import { toIsoString } from "../../../shared/database.js";

/** Traduce una fila de `sessions` al contrato interno de autenticación. */
function toStoredSession(row) {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: toIsoString(row.created_at),
    expiresAt: toIsoString(row.expires_at),
  };
}

/** Traduce una fila de `password_reset_tokens` al contrato interno. */
function toStoredPasswordResetToken(row) {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: toIsoString(row.created_at),
    expiresAt: toIsoString(row.expires_at),
  };
}

/**
 * Arma el acceso a sesiones y restablecimientos sobre una base ya abierta.
 *
 * @param database Base compartida por los repositorios de la aplicación.
 * @returns Repositorio de autenticación listo para usar.
 */
function createAuthRepository(database) {
  return {
    async insertSession(session) {
      await database.query(
        "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
        [session.id, session.userId, session.tokenHash, session.createdAt, session.expiresAt],
      );
    },

    async findSessionByTokenHash(tokenHash) {
      const { rows } = await database.query(
        "SELECT * FROM sessions WHERE token_hash = $1",
        [tokenHash],
      );

      return rows[0] ? toStoredSession(rows[0]) : null;
    },

    async deleteSession(sessionId) {
      await database.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    },

    async deleteSessionsOfUser(userId) {
      await database.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    },

    async deleteExpiredSessions(nowIso) {
      const { rowCount } = await database.query(
        "DELETE FROM sessions WHERE expires_at <= $1",
        [nowIso],
      );

      return rowCount;
    },

    async insertPasswordResetToken(token) {
      await database.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [token.id, token.userId, token.tokenHash, token.createdAt, token.expiresAt],
      );
    },

    async consumePasswordResetToken(tokenHash, nowIso) {
      const { rows } = await database.query(
        `DELETE FROM password_reset_tokens
         WHERE token_hash = $1 AND expires_at > $2
         RETURNING *`,
        [tokenHash, nowIso],
      );

      return rows[0] ? toStoredPasswordResetToken(rows[0]) : null;
    },

    async deletePasswordResetTokensOfUser(userId) {
      await database.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
    },

    async deleteExpiredPasswordResetTokens(nowIso) {
      const { rowCount } = await database.query(
        "DELETE FROM password_reset_tokens WHERE expires_at <= $1",
        [nowIso],
      );

      return rowCount;
    },

    close: () => database.close(),
  };
}

export { createAuthRepository };

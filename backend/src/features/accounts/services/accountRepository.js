// 6. Imports relativos restantes.
import { toIsoString } from '../../../shared/database.js';

/** Traduce una fila de `accounts` al contrato del dominio. */
function toStoredAccount(row) {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    createdAt: toIsoString(row.created_at),
  };
}

/**
 * Arma el acceso a las cuentas sobre una base ya abierta.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en
 * memoria para los test.
 * @returns Repositorio listo para usar.
 */
function createAccountRepository(database) {
  return {
    async insert(account) {
      await database.query(
        'INSERT INTO accounts (id, name, invite_code, created_at) VALUES ($1, $2, $3, $4)',
        [account.id, account.name, account.inviteCode, account.createdAt],
      );
    },

    async findById(id) {
      const { rows } = await database.query('SELECT * FROM accounts WHERE id = $1', [id]);

      return rows[0] ? toStoredAccount(rows[0]) : null;
    },

    async findByInviteCode(inviteCode) {
      const { rows } = await database.query(
        'SELECT * FROM accounts WHERE upper(invite_code) = upper($1)',
        [inviteCode],
      );

      return rows[0] ? toStoredAccount(rows[0]) : null;
    },

    async listAll() {
      const { rows } = await database.query('SELECT * FROM accounts ORDER BY created_at');

      return rows.map(toStoredAccount);
    },

    async updateName(id, name) {
      await database.query('UPDATE accounts SET name = $1 WHERE id = $2', [name, id]);
    },

    async updateInviteCode(id, inviteCode) {
      await database.query('UPDATE accounts SET invite_code = $1 WHERE id = $2', [inviteCode, id]);
    },

    async countMembers(id) {
      const { rows } = await database.query(
        'SELECT COUNT(*) AS total FROM users WHERE account_id = $1',
        [id],
      );

      // Postgres devuelve `bigint` para COUNT y el driver lo entrega como texto
      // para no perder precisión.
      return Number(rows[0]?.total ?? 0);
    },
  };
}

export { createAccountRepository };

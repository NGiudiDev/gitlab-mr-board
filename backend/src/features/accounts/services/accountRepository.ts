// 4. Imports exclusivos de tipos de TypeScript.
import type { Database } from '../../../shared/types.js';
import type { AccountRepository, StoredAccount } from '../types.js';

// 7. Imports relativos restantes.
import { toIsoString } from '../../../shared/database.js';

interface AccountRow {
  id: string;
  name: string;
  invite_code: string;
  created_at: Date | string;
}

/** Traduce una fila de `accounts` al contrato del dominio. */
function toStoredAccount(row: AccountRow): StoredAccount {
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
function createAccountRepository(database: Database): AccountRepository {
  return {
    async insert(account: StoredAccount): Promise<void> {
      await database.query(
        'INSERT INTO accounts (id, name, invite_code, created_at) VALUES ($1, $2, $3, $4)',
        [account.id, account.name, account.inviteCode, account.createdAt],
      );
    },

    async findById(id: string): Promise<StoredAccount | null> {
      const { rows } = await database.query<AccountRow>('SELECT * FROM accounts WHERE id = $1', [id]);

      return rows[0] ? toStoredAccount(rows[0]) : null;
    },

    async findByInviteCode(inviteCode: string): Promise<StoredAccount | null> {
      const { rows } = await database.query<AccountRow>(
        'SELECT * FROM accounts WHERE upper(invite_code) = upper($1)',
        [inviteCode],
      );

      return rows[0] ? toStoredAccount(rows[0]) : null;
    },

    async listAll(): Promise<StoredAccount[]> {
      const { rows } = await database.query<AccountRow>('SELECT * FROM accounts ORDER BY created_at');

      return rows.map(toStoredAccount);
    },

    async updateName(id: string, name: string): Promise<void> {
      await database.query('UPDATE accounts SET name = $1 WHERE id = $2', [name, id]);
    },

    async updateInviteCode(id: string, inviteCode: string): Promise<void> {
      await database.query('UPDATE accounts SET invite_code = $1 WHERE id = $2', [inviteCode, id]);
    },

    async countMembers(id: string): Promise<number> {
      const { rows } = await database.query<{ total: string | number }>(
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

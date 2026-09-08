// 4. Imports exclusivos de tipos de TypeScript.
import type { Database } from '../../../shared/types.js';
import type { GitLabSettingsRepository, StoredGitLabSettings } from '../types.js';

// 7. Imports relativos restantes.
import { toIsoString } from '../../../shared/database.js';

interface GitLabSettingsRow {
  account_id: string;
  project_ids: string[];
  encrypted_access_token: string;
  updated_at: Date | string;
}

/** Traduce una fila de `account_gitlab_settings` al contrato del dominio. */
function toStoredSettings(row: GitLabSettingsRow): StoredGitLabSettings {
  return {
    accountId: row.account_id,
    projectIds: row.project_ids,
    encryptedAccessToken: row.encrypted_access_token,
    updatedAt: toIsoString(row.updated_at),
  };
}

/**
 * Arma el acceso a la configuración de GitLab sobre una base ya abierta.
 *
 * Los IDs se guardan en una columna `TEXT[]`: es una lista corta que siempre se
 * lee completa, así que una tabla aparte no aportaría nada.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en
 * memoria para los test.
 * @returns Repositorio listo para usar.
 */
function createGitLabSettingsRepository(database: Database): GitLabSettingsRepository {
  return {
    async findByAccountId(accountId: string): Promise<StoredGitLabSettings | null> {
      const { rows } = await database.query<GitLabSettingsRow>(
        'SELECT * FROM account_gitlab_settings WHERE account_id = $1',
        [accountId],
      );

      return rows[0] ? toStoredSettings(rows[0]) : null;
    },

    // Cada cuenta tiene una sola configuración, así que el alta y la
    // modificación son la misma operación.
    async save(settings: StoredGitLabSettings): Promise<void> {
      await database.query(
        `INSERT INTO account_gitlab_settings (account_id, project_ids, encrypted_access_token, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (account_id) DO UPDATE SET
           project_ids = EXCLUDED.project_ids,
           encrypted_access_token = EXCLUDED.encrypted_access_token,
           updated_at = EXCLUDED.updated_at`,
        [
          settings.accountId,
          settings.projectIds,
          settings.encryptedAccessToken,
          settings.updatedAt,
        ],
      );
    },

    async deleteByAccountId(accountId: string): Promise<void> {
      await database.query('DELETE FROM account_gitlab_settings WHERE account_id = $1', [accountId]);
    },
  };
}

export { createGitLabSettingsRepository };

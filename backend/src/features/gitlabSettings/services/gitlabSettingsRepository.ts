// 4. Imports exclusivos de tipos de TypeScript.
import type { Database } from '../../../shared/types.js';
import type { GitLabSettingsRepository, StoredGitLabSettings } from '../types.js';

// 7. Imports relativos restantes.
import { toIsoString } from '../../../shared/database.js';

interface GitLabSettingsRow {
  user_id: string;
  project_ids: string[];
  encrypted_access_token: string;
  gitlab_username: string | null;
  updated_at: Date | string;
}

/** Traduce una fila de `gitlab_settings` al contrato del dominio. */
function toStoredSettings(row: GitLabSettingsRow): StoredGitLabSettings {
  return {
    userId: row.user_id,
    projectIds: row.project_ids,
    encryptedAccessToken: row.encrypted_access_token,
    gitlabUsername: row.gitlab_username,
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
    async findByUserId(userId: string): Promise<StoredGitLabSettings | null> {
      const { rows } = await database.query<GitLabSettingsRow>(
        'SELECT * FROM gitlab_settings WHERE user_id = $1',
        [userId],
      );

      return rows[0] ? toStoredSettings(rows[0]) : null;
    },

    // Cada persona tiene una sola configuración, así que el alta y la
    // modificación son la misma operación.
    async save(settings: StoredGitLabSettings): Promise<void> {
      await database.query(
        `INSERT INTO gitlab_settings (user_id, project_ids, encrypted_access_token, gitlab_username, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           project_ids = EXCLUDED.project_ids,
           encrypted_access_token = EXCLUDED.encrypted_access_token,
           gitlab_username = EXCLUDED.gitlab_username,
           updated_at = EXCLUDED.updated_at`,
        [
          settings.userId,
          settings.projectIds,
          settings.encryptedAccessToken,
          settings.gitlabUsername,
          settings.updatedAt,
        ],
      );
    },

    async deleteByUserId(userId: string): Promise<void> {
      await database.query('DELETE FROM gitlab_settings WHERE user_id = $1', [userId]);
    },
  };
}

export { createGitLabSettingsRepository };

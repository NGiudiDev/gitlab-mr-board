// 4. Imports exclusivos de tipos de TypeScript.
import type { GitLabSettingsRepository, StoredGitLabSettings } from '../types.js';
import type { DatabaseSync } from 'node:sqlite';

const PROJECT_ID_SEPARATOR = ',';

interface GitLabSettingsRow {
  user_id: string;
  project_ids: string;
  encrypted_access_token: string;
  updated_at: string;
}

/** Traduce una fila de `gitlab_settings` al contrato del dominio. */
function toStoredSettings(row: GitLabSettingsRow): StoredGitLabSettings {
  return {
    userId: row.user_id,
    projectIds: row.project_ids.split(PROJECT_ID_SEPARATOR).filter(Boolean),
    encryptedAccessToken: row.encrypted_access_token,
    updatedAt: row.updated_at,
  };
}

/**
 * Arma el acceso a la configuración de GitLab sobre una conexión ya abierta.
 *
 * Los IDs se guardan como una cadena separada por comas: son una lista corta
 * que siempre se lee completa, así que una tabla aparte no aportaría nada.
 *
 * @param database Conexión devuelta por `openDatabase`.
 * @returns Repositorio con sentencias preparadas y listo para usar.
 */
function createGitLabSettingsRepository(database: DatabaseSync): GitLabSettingsRepository {
  const findStatement = database.prepare('SELECT * FROM gitlab_settings WHERE user_id = ?');
  const deleteStatement = database.prepare('DELETE FROM gitlab_settings WHERE user_id = ?');

  // Cada persona tiene una sola configuración, así que el alta y la
  // modificación son la misma operación.
  const saveStatement = database.prepare(
    `INSERT INTO gitlab_settings (user_id, project_ids, encrypted_access_token, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       project_ids = excluded.project_ids,
       encrypted_access_token = excluded.encrypted_access_token,
       updated_at = excluded.updated_at`,
  );

  return {
    findByUserId(userId: string): StoredGitLabSettings | null {
      const row = findStatement.get(userId) as unknown as GitLabSettingsRow | undefined;
      return row ? toStoredSettings(row) : null;
    },

    save(settings: StoredGitLabSettings): void {
      saveStatement.run(
        settings.userId,
        settings.projectIds.join(PROJECT_ID_SEPARATOR),
        settings.encryptedAccessToken,
        settings.updatedAt,
      );
    },

    deleteByUserId(userId: string): void {
      deleteStatement.run(userId);
    },
  };
}

export { createGitLabSettingsRepository };

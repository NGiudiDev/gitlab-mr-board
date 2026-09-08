// Contratos de la feature que guarda los proyectos y el access token de una
// cuenta. El token nunca sale del backend en claro.

/** Cifrado simétrico de los secretos que el backend guarda en la base. */
export interface SecretCipher {
  encrypt: (plainText: string) => string;
  decrypt: (payload: string) => string;
}

/** Fila de `account_gitlab_settings`; el access token nunca se guarda en claro. */
export interface StoredGitLabSettings {
  accountId: string;
  projectIds: string[];
  encryptedAccessToken: string;
  updatedAt: string;
}

/** Vista que se expone al frontend: describe el token pero no lo revela. */
export interface GitLabSettingsSummary {
  projectIds: string[];
  /** Últimos caracteres del token, para reconocer cuál está guardado. */
  tokenHint: string;
  updatedAt: string;
}

/** Credenciales con las que se consulta GitLab en nombre de una cuenta. */
export interface GitLabCredentials {
  accessToken: string;
  projectIds: string[];
  /** Cambia con cada guardado; identifica la versión vigente de la caché. */
  updatedAt: string;
}

export interface SaveGitLabSettingsInput {
  /** Lista de IDs, o una cadena separada por comas tal como la escribe la persona. */
  projectIds: unknown;
  /** Token nuevo. Si se omite, se conserva el que ya estaba guardado. */
  accessToken?: string | undefined;
}

/** Acceso persistente a la configuración de GitLab de una cuenta. */
export interface GitLabSettingsRepository {
  findByAccountId: (accountId: string) => Promise<StoredGitLabSettings | null>;
  save: (settings: StoredGitLabSettings) => Promise<void>;
  deleteByAccountId: (accountId: string) => Promise<void>;
}

export interface GitLabSettingsServiceOptions {
  repository: GitLabSettingsRepository;
  /** Cifrador del access token. */
  cipher: SecretCipher;
  /** Reloj inyectable para fijar `updatedAt` en los test. */
  now?: () => Date;
}

export interface GitLabSettingsService {
  getSummary: (accountId: string) => Promise<GitLabSettingsSummary | null>;
  /** Devuelve el token descifrado; sólo para uso interno del backend. */
  getCredentials: (accountId: string) => Promise<GitLabCredentials | null>;
  save: (accountId: string, input: SaveGitLabSettingsInput) => Promise<GitLabSettingsSummary>;
  remove: (accountId: string) => Promise<void>;
}

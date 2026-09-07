// Contratos de la feature que guarda los proyectos y el access token de cada
// persona. El token nunca sale del backend en claro.

/** Cifrado simétrico de los secretos que el backend guarda en la base. */
export interface SecretCipher {
  encrypt: (plainText: string) => string;
  decrypt: (payload: string) => string;
}

/** Fila de `gitlab_settings`; el access token nunca se guarda en claro. */
export interface StoredGitLabSettings {
  userId: string;
  projectIds: string[];
  encryptedAccessToken: string;
  /** Nickname de GitLab de la persona; `null` en configuraciones anteriores al campo. */
  gitlabUsername: string | null;
  updatedAt: string;
}

/** Vista que se expone al frontend: describe el token pero no lo revela. */
export interface GitLabSettingsSummary {
  projectIds: string[];
  /** Últimos caracteres del token, para reconocer cuál está guardado. */
  tokenHint: string;
  gitlabUsername: string | null;
}

/** Credenciales con las que se consulta GitLab en nombre de una persona. */
export interface GitLabCredentials {
  accessToken: string;
  projectIds: string[];
  /** Con quién se identifica esta persona dentro de GitLab. */
  gitlabUsername: string | null;
  /** Cambia con cada guardado; identifica la versión vigente de la caché. */
  updatedAt: string;
}

export interface SaveGitLabSettingsInput {
  /** Lista de IDs, o una cadena separada por comas tal como la escribe la persona. */
  projectIds: unknown;
  /** Nickname de GitLab, tal como lo escribe la persona. */
  gitlabUsername: unknown;
  /** Token nuevo. Si se omite, se conserva el que ya estaba guardado. */
  accessToken?: string | undefined;
}

/** Acceso persistente a la configuración de GitLab. */
export interface GitLabSettingsRepository {
  findByUserId: (userId: string) => Promise<StoredGitLabSettings | null>;
  save: (settings: StoredGitLabSettings) => Promise<void>;
  deleteByUserId: (userId: string) => Promise<void>;
}

export interface GitLabSettingsServiceOptions {
  repository: GitLabSettingsRepository;
  /** Cifrador del access token. */
  cipher: SecretCipher;
  /** Reloj inyectable para fijar `updatedAt` en los test. */
  now?: () => Date;
}

export interface GitLabSettingsService {
  getSummary: (userId: string) => Promise<GitLabSettingsSummary | null>;
  /** Devuelve el token descifrado; sólo para uso interno del backend. */
  getCredentials: (userId: string) => Promise<GitLabCredentials | null>;
  save: (userId: string, input: SaveGitLabSettingsInput) => Promise<GitLabSettingsSummary>;
  remove: (userId: string) => Promise<void>;
}

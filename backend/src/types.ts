// 4. Imports exclusivos de tipos de TypeScript.
import type { Express } from 'express';
import type { IncomingHttpHeaders } from 'node:http';

// Tipos compartidos de infraestructura.
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;
export type QueueResolver = () => void;

/** Resultado de una consulta SQL, con la misma forma para todos los drivers. */
export interface SqlResult<T> {
  rows: T[];
  /** Filas afectadas por un `INSERT`, `UPDATE` o `DELETE`. */
  rowCount: number;
}

/**
 * Acceso a Postgres, reducido a lo que necesitan los repositorios.
 *
 * Mantenerlo mínimo es lo que permite que los test corran contra PGlite —un
 * Postgres en memoria— sin que el código de producción sepa de esa diferencia.
 */
export interface Database {
  query: <T>(text: string, params?: unknown[]) => Promise<SqlResult<T>>;
  close: () => Promise<void>;
}

export interface GitLabResponse<T> {
  data: T;
  headers: Headers;
}

/** Acceso a la API de GitLab ya autenticado con las credenciales de una persona. */
export interface GitLabClient {
  fetchWithLimit: <T>(resourcePath: string, params?: QueryParams) => Promise<GitLabResponse<T>>;
  fetchPaginatedWithLimit: <T>(resourcePath: string, params?: QueryParams) => Promise<T[]>;
}

export interface MergeRequestsDependencies {
  /** Fuente de datos de los merge requests; inyectable en los test. */
  fetchMergeRequests?: (credentials: GitLabCredentials) => Promise<MergeRequestResponse>;
  /** Reloj de la caché; inyectable en los test. */
  now?: () => number;
}

export interface CreateAppOptions extends MergeRequestsDependencies {
  /** Servicio de autenticación; inyectable para aislar la base en los test. */
  authService?: AuthService;
  /** Configuración de GitLab; inyectable para aislar la base en los test. */
  gitlabSettingsService?: GitLabSettingsService;
}

export interface MergeRequestsRouterOptions extends MergeRequestsDependencies {
  /** Origen de las credenciales con las que se consulta GitLab. */
  gitlabSettingsService: GitLabSettingsService;
}

// Contratos recibidos desde la API de GitLab.
export interface GitLabUser {
  name: string;
  username: string;
  avatar_url: string | null;
}

export interface GitLabReferences {
  full?: string;
}

export interface GitLabPipeline {
  status?: string;
  web_url?: string;
}

export interface GitLabMergeRequest {
  project_id: number;
  iid: number;
  title: string;
  web_url: string;
  author: GitLabUser | null;
  references?: GitLabReferences;
  source_branch: string;
  target_branch: string;
  labels?: string[];
  draft?: boolean;
  work_in_progress?: boolean;
  has_conflicts?: boolean;
  reviewers?: GitLabUser[];
  updated_at: string;
  created_at: string;
  head_pipeline?: GitLabPipeline;
  pipeline?: GitLabPipeline;
}

export interface GitLabApproval {
  user: Pick<GitLabUser, 'username'>;
}

export interface GitLabApprovalsResponse {
  approved_by?: GitLabApproval[];
}

export interface GitLabDiscussionNote {
  resolvable?: boolean;
  resolved?: boolean;
}

export interface GitLabDiscussion {
  notes?: GitLabDiscussionNote[];
}

export interface GitLabProject {
  path_with_namespace: string;
}

// Contratos del dominio expuestos al frontend.
export interface ApprovalStatus {
  status: 'approved' | 'pending' | 'unknown';
  required: number;
  given: number;
  approvers?: string[];
  hasLeadApproval?: boolean;
}

export interface ThreadStatus {
  status: 'open' | 'resolved' | 'unknown';
  unresolvedCount: number;
}

export interface PipelineStatus {
  status: string;
  pipelineUrl: string | null;
}

export type Mergeability =
  | 'backlog'
  | 'in_progress'
  | 'qa'
  | 'mr_warning'
  | 'review'
  | 'ready_to_merge'
  | 'unknown';

export interface MergeRequestReviewer {
  name: string;
  username: string;
  avatar: string | null;
}

/** Identidad estable de una persona del equipo, sin datos de presentación. */
export interface MergeRequestPerson {
  name: string;
  username: string;
}

export interface MergeRequestBlockers {
  approvals: ApprovalStatus;
  threads: ThreadStatus;
  pipeline: PipelineStatus;
}

export interface EnrichedMergeRequest {
  id: string;
  iid: number;
  title: string;
  url: string;
  author: string;
  authorUsername: string | null;
  authorAvatar: string | null;
  projectPath: string;
  projectId: number;
  sourceBranch: string;
  targetBranch: string;
  hasConflicts: boolean;
  reviewers: MergeRequestReviewer[];
  updatedAt: string;
  createdAt: string;
  blockers: MergeRequestBlockers;
  mergeability: Mergeability;
  responsiblePeople: MergeRequestPerson[];
}

export interface MergeRequestMetadata {
  fetchedAt: string;
  projectCount: number;
  totalMRs: number;
  allProjects: string[];
  /** Personas que participan de los merge requests consultados, sin duplicados. */
  people: MergeRequestPerson[];
}

export interface MergeRequestResponse {
  mergeRequests: EnrichedMergeRequest[];
  meta: MergeRequestMetadata;
}

// Contratos de autenticación.
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

/** Fila de `users` tal como se guarda en Postgres. */
export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

/** Fila de `sessions`; el token viaja hasheado para que un volcado de la base no permita suplantar. */
export interface StoredSession {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
}

/** Identidad que el backend expone al frontend, sin credenciales. */
export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

/** Alta hecha por la propia persona: no puede elegir su rol. */
export interface RegisterUserInput {
  username: string;
  password: string;
  displayName?: string;
}

/** Vista de un usuario para la pantalla de administración. */
export interface UserSummary extends AuthenticatedUser {
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface LoginResult {
  user: AuthenticatedUser;
  token: string;
  expiresAt: Date;
}

/** Acceso persistente a usuarios y sesiones. */
export interface AuthRepository {
  insertUser: (user: StoredUser) => Promise<void>;
  findUserById: (id: string) => Promise<StoredUser | null>;
  findUserByUsername: (username: string) => Promise<StoredUser | null>;
  listUsers: () => Promise<StoredUser[]>;
  countUsers: () => Promise<number>;
  updateLastLogin: (userId: string, lastLoginAt: string) => Promise<void>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  updateStatus: (userId: string, status: UserStatus) => Promise<void>;
  /** Devuelve si borró algo; sesiones y configuración caen en cascada. */
  deleteUser: (userId: string) => Promise<boolean>;
  insertSession: (session: StoredSession) => Promise<void>;
  findSessionByTokenHash: (tokenHash: string) => Promise<StoredSession | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteSessionsOfUser: (userId: string) => Promise<void>;
  deleteExpiredSessions: (nowIso: string) => Promise<number>;
  close: () => Promise<void>;
}

export interface AuthServiceOptions {
  repository: AuthRepository;
  /** Reloj inyectable para fijar vencimientos en los test. */
  now?: () => Date;
  sessionDurationDays?: number;
}

export interface AuthService {
  createUser: (input: CreateUserInput) => Promise<AuthenticatedUser>;
  register: (input: RegisterUserInput) => Promise<LoginResult>;
  login: (credentials: { username: string; password: string }) => Promise<LoginResult>;
  authenticate: (token: string | undefined) => Promise<AuthenticatedUser | null>;
  logout: (token: string | undefined) => Promise<void>;
  changePassword: (username: string, newPassword: string) => Promise<void>;
  changeOwnPassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setUserStatus: (username: string, status: UserStatus) => Promise<UserSummary>;
  /** Devuelve si el usuario existía; borrarlo arrastra sesiones y configuración. */
  deleteUser: (username: string) => Promise<boolean>;
  listUsers: () => Promise<UserSummary[]>;
  close: () => Promise<void>;
}

// Contratos de la configuración de GitLab de cada persona.

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
  updatedAt: string;
}

/** Vista que se expone al frontend: describe el token pero no lo revela. */
export interface GitLabSettingsSummary {
  projectIds: string[];
  /** Últimos caracteres del token, para reconocer cuál está guardado. */
  tokenHint: string;
  updatedAt: string;
}

/** Credenciales con las que se consulta GitLab en nombre de una persona. */
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

// Contratos usados exclusivamente por la infraestructura de test.
export interface HttpTestOptions {
  method?: string;
  /** Cuerpo que se serializa como JSON. */
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HttpTestResponse {
  status: number;
  body: string;
  headers: IncomingHttpHeaders;
  json: <T>() => T;
}

export type FixtureOr<T> = T | number;
export type ApprovalsFixture = GitLabApprovalsResponse;
export type PipelineFixture = GitLabPipeline;
export type DiscussionFixture = GitLabDiscussion;

export interface GitLabFixture {
  /** Ruta del proyecto por ID, o código HTTP de error. */
  projects?: Record<string, FixtureOr<string>>;
  /** Páginas de MRs abiertos por ID de proyecto. */
  mergeRequestPages?: Record<string, FixtureOr<GitLabMergeRequest[][]>>;
  /** Claves con el formato `projectId-iid`. */
  approvals?: Record<string, FixtureOr<ApprovalsFixture>>;
  /** Páginas de discusiones por MR. */
  discussions?: Record<string, FixtureOr<DiscussionFixture[][]>>;
  pipelines?: Record<string, FixtureOr<PipelineFixture[]>>;
}

export interface GitLabStub {
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
  /** URLs solicitadas, en orden, para verificar paginación y concurrencia. */
  requestedUrls: string[];
  /** Cabeceras enviadas en cada llamada, para verificar el token. */
  sentHeaders: Array<Record<string, string>>;
}

/** App levantada con una sesión ya iniciada, para los test de rutas protegidas. */
export interface AuthenticatedTestApp {
  app: Express;
  authService: AuthService;
  gitlabSettingsService: GitLabSettingsService;
  /** Usuario de la sesión abierta. */
  user: AuthenticatedUser;
  /** Cabecera Cookie lista para reenviar en cada petición. */
  cookie: string;
}

export interface GitLabTestItem {
  id: number;
}

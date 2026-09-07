// 4. Imports exclusivos de tipos de TypeScript.
import type { Express } from 'express';
import type { IncomingHttpHeaders } from 'node:http';

// Tipos compartidos de infraestructura.
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;
export type QueueResolver = () => void;

export interface GitLabResponse<T> {
  data: T;
  headers: Headers;
}

export interface MergeRequestsDependencies {
  /** Fuente de datos de los merge requests; inyectable en los test. */
  fetchMergeRequests?: () => Promise<MergeRequestResponse>;
  /** Reloj de la caché; inyectable en los test. */
  now?: () => number;
}

export interface CreateAppOptions extends MergeRequestsDependencies {
  /** Servicio de autenticación; inyectable para aislar la base en los test. */
  authService?: AuthService;
}

export type MergeRequestsRouterOptions = MergeRequestsDependencies;

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

/** Fila de `users` tal como se guarda en SQLite. */
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
  insertUser: (user: StoredUser) => void;
  findUserById: (id: string) => StoredUser | null;
  findUserByUsername: (username: string) => StoredUser | null;
  listUsers: () => StoredUser[];
  countUsers: () => number;
  updateLastLogin: (userId: string, lastLoginAt: string) => void;
  updatePasswordHash: (userId: string, passwordHash: string) => void;
  updateStatus: (userId: string, status: UserStatus) => void;
  insertSession: (session: StoredSession) => void;
  findSessionByTokenHash: (tokenHash: string) => StoredSession | null;
  deleteSession: (sessionId: string) => void;
  deleteSessionsOfUser: (userId: string) => void;
  deleteExpiredSessions: (nowIso: string) => number;
  close: () => void;
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
  authenticate: (token: string | undefined) => AuthenticatedUser | null;
  logout: (token: string | undefined) => void;
  changePassword: (username: string, newPassword: string) => Promise<void>;
  changeOwnPassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setUserStatus: (username: string, status: UserStatus) => UserSummary;
  listUsers: () => UserSummary[];
  close: () => void;
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
  /** Cabecera Cookie lista para reenviar en cada petición. */
  cookie: string;
}

export interface GitLabTestItem {
  id: number;
}

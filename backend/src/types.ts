// Tipos compartidos de infraestructura.
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;
export type QueueResolver = () => void;

export interface GitLabResponse<T> {
  data: T;
  headers: Headers;
}

export interface MergeRequestsDependencies {
  /** Fuente de datos de los merge requests; inyectable en las pruebas. */
  fetchMergeRequests?: () => Promise<MergeRequestResponse>;
  /** Reloj de la caché; inyectable en las pruebas. */
  now?: () => number;
}

export type CreateAppOptions = MergeRequestsDependencies;
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
  labels: string[];
  isDraft: boolean;
  hasConflicts: boolean;
  reviewers: MergeRequestReviewer[];
  updatedAt: string;
  createdAt: string;
  blockers: MergeRequestBlockers;
  mergeability: Mergeability;
}

export interface MergeRequestMetadata {
  fetchedAt: string;
  projectCount: number;
  totalMRs: number;
  allProjects: string[];
}

export interface MergeRequestResponse {
  mergeRequests: EnrichedMergeRequest[];
  meta: MergeRequestMetadata;
}

// Contratos usados exclusivamente por la infraestructura de pruebas.
export interface HttpTestResponse {
  status: number;
  body: string;
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

export interface GitLabTestItem {
  id: number;
}

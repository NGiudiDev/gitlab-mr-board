// 4. Imports exclusivos de tipos de TypeScript.
import type { GitLabCredentials } from '../gitlabSettings/types.js';

// Parámetros de consulta que acepta el cliente de GitLab.
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface GitLabResponse<T> {
  data: T;
  headers: Headers;
}

/** Acceso a la API de GitLab ya autenticado con las credenciales de una persona. */
export interface GitLabClient {
  fetchWithLimit: <T>(resourcePath: string, params?: QueryParams) => Promise<GitLabResponse<T>>;
  fetchPaginatedWithLimit: <T>(resourcePath: string, params?: QueryParams) => Promise<T[]>;
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

export interface MergeRequestsDependencies {
  /** Fuente de datos de los merge requests; inyectable en los test. */
  fetchMergeRequests?: (credentials: GitLabCredentials) => Promise<MergeRequestResponse>;
  /** Reloj de la caché; inyectable en los test. */
  now?: () => number;
}

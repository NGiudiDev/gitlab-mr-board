export type QueryValue = string | number | boolean | null | undefined;

export interface GitLabUser {
  name: string;
  username: string;
  avatar_url: string | null;
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
  references?: { full?: string };
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

export interface ApprovalStatus {
  status: 'approved' | 'pending' | 'unknown';
  required: number;
  given: number;
  approvers?: string[];
  hasLeadApproval?: boolean;
  missingApprovers: string[];
}

export interface ThreadStatus {
  status: 'open' | 'resolved' | 'unknown';
  unresolvedCount: number;
}

export interface PipelineStatus {
  status: string;
  pipelineUrl: string | null;
}

export type Mergeability = 'backlog' | 'gray' | 'qa' | 'yellow' | 'review' | 'green';

export interface EnrichedMergeRequest {
  id: string;
  iid: number;
  title: string;
  url: string;
  author: string;
  authorAvatar: string | null;
  projectPath: string;
  projectId: number;
  sourceBranch: string;
  targetBranch: string;
  labels: string[];
  isDraft: boolean;
  hasConflicts: boolean;
  reviewers: Array<{ name: string; username: string; avatar: string | null }>;
  updatedAt: string;
  createdAt: string;
  blockers: { approvals: ApprovalStatus; threads: ThreadStatus; pipeline: PipelineStatus };
  mergeability: Mergeability;
}

export interface MergeRequestResponse {
  mergeRequests: EnrichedMergeRequest[];
  meta: {
    fetchedAt: string;
    projectCount: number;
    totalMRs: number;
    allProjects: string[];
  };
}

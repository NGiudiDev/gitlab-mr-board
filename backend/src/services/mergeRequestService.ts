import config from '../config.js';
import type {
  ApprovalStatus,
  EnrichedMergeRequest,
  GitLabMergeRequest,
  Mergeability,
  MergeRequestResponse,
  PipelineStatus,
  ThreadStatus,
} from '../types.js';
import { fetchPaginatedWithLimit, fetchWithLimit } from './gitlabApi.js';

interface GitLabApproval {
  user: { username: string };
}

interface GitLabApprovalsResponse {
  approved_by?: GitLabApproval[];
}

interface GitLabDiscussion {
  notes?: Array<{ resolvable?: boolean; resolved?: boolean }>;
}

interface GitLabProject {
  path_with_namespace: string;
}

async function fetchOpenMRsForProject(projectId: string): Promise<GitLabMergeRequest[]> {
  return fetchPaginatedWithLimit<GitLabMergeRequest>(`/projects/${projectId}/merge_requests`, {
    state: 'opened', scope: 'all', order_by: 'updated_at', sort: 'desc',
  });
}

async function fetchApprovals(projectId: number, mrIid: number): Promise<ApprovalStatus> {
  try {
    const { data } = await fetchWithLimit<GitLabApprovalsResponse>(
      `/projects/${projectId}/merge_requests/${mrIid}/approvals`,
    );
    const approvedBy = data.approved_by ?? [];
    const approvers = approvedBy.map(({ user }) => user.username);
    const hasLeadApproval = approvers.includes(config.teamLeadUsername);

    return {
      status: approvedBy.length >= config.minApprovals && hasLeadApproval ? 'approved' : 'pending',
      required: config.minApprovals,
      given: approvedBy.length,
      approvers,
      hasLeadApproval,
      missingApprovers: [],
    };
  } catch {
    return { status: 'unknown', required: 0, given: 0, missingApprovers: [] };
  }
}

async function fetchUnresolvedThreads(projectId: number, mrIid: number): Promise<ThreadStatus> {
  try {
    const discussions = await fetchPaginatedWithLimit<GitLabDiscussion>(
      `/projects/${projectId}/merge_requests/${mrIid}/discussions`,
    );
    const unresolvedCount = discussions.filter(({ notes = [] }) =>
      notes.some((note) => note.resolvable && !note.resolved)).length;

    return { status: unresolvedCount > 0 ? 'open' : 'resolved', unresolvedCount };
  } catch {
    return { status: 'unknown', unresolvedCount: 0 };
  }
}

async function fetchPipeline(projectId: number, mrIid: number): Promise<PipelineStatus> {
  try {
    const { data } = await fetchWithLimit<Array<{ status?: string; web_url?: string }>>(
      `/projects/${projectId}/merge_requests/${mrIid}/pipelines`,
    );
    const latest = data[0];
    if (!latest) return { status: 'none', pipelineUrl: null };
    return { status: latest.status ?? 'unknown', pipelineUrl: latest.web_url ?? null };
  } catch {
    return { status: 'none', pipelineUrl: null };
  }
}

function computeMergeability(
  mr: GitLabMergeRequest,
  approvals: ApprovalStatus,
  threads: ThreadStatus,
  pipeline: PipelineStatus,
): Mergeability {
  const labels = (mr.labels ?? []).map((label) => label.toLowerCase());
  if (labels.includes('backlog')) return 'backlog';
  if (mr.draft || mr.work_in_progress) return 'gray';

  const isBlocked = mr.has_conflicts
    || pipeline.status === 'failed'
    || pipeline.status === 'canceled'
    || threads.status === 'open';

  if (labels.includes('qa_pending')) return 'qa';
  if (isBlocked) return 'yellow';
  if (pipeline.status === 'running' || pipeline.status === 'pending') return 'yellow';
  if (approvals.status === 'pending') return 'review';
  if (!labels.includes('qa_approved')) return 'yellow';
  return 'green';
}

function extractProjectPath(mr: GitLabMergeRequest): string {
  const reference = mr.references?.full;
  if (reference) {
    const separatorIndex = reference.lastIndexOf('!');
    if (separatorIndex > -1) return reference.slice(0, separatorIndex);
  }

  try {
    return new URL(mr.web_url).pathname.split('/-/merge_requests/')[0]?.replace(/^\//, '')
      || `project-${mr.project_id}`;
  } catch {
    return `project-${mr.project_id}`;
  }
}

async function enrichMR(mr: GitLabMergeRequest): Promise<EnrichedMergeRequest> {
  const [approvals, threads, pipeline] = await Promise.all([
    fetchApprovals(mr.project_id, mr.iid),
    fetchUnresolvedThreads(mr.project_id, mr.iid),
    fetchPipeline(mr.project_id, mr.iid),
  ]);

  return {
    id: `${mr.project_id}-${mr.iid}`,
    iid: mr.iid,
    title: mr.title,
    url: mr.web_url,
    author: mr.author?.name ?? 'desconocido',
    authorAvatar: mr.author?.avatar_url ?? null,
    projectPath: extractProjectPath(mr),
    projectId: mr.project_id,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    labels: mr.labels ?? [],
    isDraft: Boolean(mr.draft || mr.work_in_progress),
    hasConflicts: Boolean(mr.has_conflicts),
    reviewers: (mr.reviewers ?? []).map((reviewer) => ({
      name: reviewer.name, username: reviewer.username, avatar: reviewer.avatar_url,
    })),
    updatedAt: mr.updated_at,
    createdAt: mr.created_at,
    blockers: { approvals, threads, pipeline },
    mergeability: computeMergeability(mr, approvals, threads, pipeline),
  };
}

async function fetchProjectPath(projectId: string): Promise<string> {
  try {
    const { data } = await fetchWithLimit<GitLabProject>(`/projects/${projectId}`);
    return data.path_with_namespace;
  } catch {
    return `project-${projectId}`;
  }
}

async function getAllMergeRequests(): Promise<MergeRequestResponse> {
  const [projectResults, projectPaths] = await Promise.all([
    Promise.all(config.projectIds.map((id) => fetchOpenMRsForProject(id).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error al obtener MRs del proyecto ${id}:`, message);
      return [];
    }))),
    Promise.all(config.projectIds.map(fetchProjectPath)),
  ]);
  const enriched = await Promise.all(projectResults.flat().map(enrichMR));
  enriched.sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt));

  return {
    mergeRequests: enriched,
    meta: {
      fetchedAt: new Date().toISOString(),
      projectCount: config.projectIds.length,
      totalMRs: enriched.length,
      allProjects: projectPaths,
    },
  };
}

export { getAllMergeRequests };

// 4. Imports exclusivos de tipos de TypeScript.
import type { GitLabCredentials } from '../../gitlabSettings/types.js';
import type { ApprovalStatus, EnrichedMergeRequest, GitLabApprovalsResponse, GitLabClient, GitLabDiscussion, GitLabMergeRequest, GitLabPipeline, GitLabProject, GitLabUser, MergeRequestMetadata, MergeRequestResponse, MergeRequestReviewer, PipelineStatus, ThreadStatus } from '../types.js';

// 7. Imports relativos restantes.
import config from '../../../config.js';
import { createGitLabClient } from './gitlabApi.js';
import { collectPeople, computeMergeability, computeResponsiblePeople, extractProjectPath } from './mergeRequestRules.js';

/** Construye la ruta común de un merge request en la API de GitLab. */
function mergeRequestPath(projectId: number, mergeRequestIid: number): string {
  return `/projects/${projectId}/merge_requests/${mergeRequestIid}`;
}

/** Obtiene los merge requests abiertos de un proyecto. */
async function fetchOpenMRsForProject(
  client: GitLabClient,
  projectId: string,
): Promise<GitLabMergeRequest[]> {
  return client.fetchPaginatedWithLimit<GitLabMergeRequest>(`/projects/${projectId}/merge_requests`, {
    state: 'opened',
    scope: 'all',
    order_by: 'updated_at',
    sort: 'desc',
  });
}

/**
 * Consulta aprobaciones y degrada a `unknown` si GitLab no ofrece el detalle.
 * La vista parcial sigue siendo útil aunque falle este recurso secundario.
 */
async function fetchApprovals(
  client: GitLabClient,
  projectId: number,
  mergeRequestIid: number,
): Promise<ApprovalStatus> {
  try {
    const { data } = await client.fetchWithLimit<GitLabApprovalsResponse>(
      `${mergeRequestPath(projectId, mergeRequestIid)}/approvals`,
    );
    const approvedBy = data.approved_by ?? [];
    const approvers = approvedBy.map(({ user }) => user.username);
    const hasLeadApproval = approvers.includes(config.teamLeadUsername);
    const hasRequiredApprovals = approvedBy.length >= config.minApprovals;

    return {
      status: hasRequiredApprovals && hasLeadApproval ? 'approved' : 'pending',
      required: config.minApprovals,
      given: approvedBy.length,
      approvers,
      hasLeadApproval,
    };
  } catch {
    return { status: 'unknown', required: 0, given: 0 };
  }
}

/** Indica si una discusión contiene al menos una nota resoluble pendiente. */
function hasUnresolvedNote({ notes = [] }: GitLabDiscussion): boolean {
  return notes.some((note) => note.resolvable && !note.resolved);
}

/** Consulta la cantidad de discusiones pendientes de un merge request. */
async function fetchUnresolvedThreads(
  client: GitLabClient,
  projectId: number,
  mergeRequestIid: number,
): Promise<ThreadStatus> {
  try {
    const discussions = await client.fetchPaginatedWithLimit<GitLabDiscussion>(
      `${mergeRequestPath(projectId, mergeRequestIid)}/discussions`,
    );
    const unresolvedCount = discussions.filter(hasUnresolvedNote).length;

    return { status: unresolvedCount > 0 ? 'open' : 'resolved', unresolvedCount };
  } catch {
    return { status: 'unknown', unresolvedCount: 0 };
  }
}

/** Consulta el pipeline más reciente y usa `none` si no existe o falla. */
async function fetchPipeline(
  client: GitLabClient,
  projectId: number,
  mergeRequestIid: number,
): Promise<PipelineStatus> {
  try {
    const { data } = await client.fetchWithLimit<GitLabPipeline[]>(
      `${mergeRequestPath(projectId, mergeRequestIid)}/pipelines`,
    );
    const latestPipeline = data[0];
    if (!latestPipeline) return { status: 'none', pipelineUrl: null };

    return {
      status: latestPipeline.status ?? 'unknown',
      pipelineUrl: latestPipeline.web_url ?? null,
    };
  } catch {
    return { status: 'none', pipelineUrl: null };
  }
}

/** Adapta un usuario de GitLab al contrato público de reviewers. */
function mapReviewer(reviewer: GitLabUser): MergeRequestReviewer {
  return {
    name: reviewer.name,
    username: reviewer.username,
    avatar: reviewer.avatar_url,
  };
}

/** Enriquece un merge request con sus bloqueos y clasificación. */
async function enrichMergeRequest(
  client: GitLabClient,
  mergeRequest: GitLabMergeRequest,
): Promise<EnrichedMergeRequest> {
  const [approvals, threads, pipeline] = await Promise.all([
    fetchApprovals(client, mergeRequest.project_id, mergeRequest.iid),
    fetchUnresolvedThreads(client, mergeRequest.project_id, mergeRequest.iid),
    fetchPipeline(client, mergeRequest.project_id, mergeRequest.iid),
  ]);

  const mergeability = computeMergeability(mergeRequest, approvals, threads, pipeline);

  return {
    id: `${mergeRequest.project_id}-${mergeRequest.iid}`,
    iid: mergeRequest.iid,
    title: mergeRequest.title,
    url: mergeRequest.web_url,
    author: mergeRequest.author?.name ?? 'desconocido',
    authorUsername: mergeRequest.author?.username ?? null,
    authorAvatar: mergeRequest.author?.avatar_url ?? null,
    projectPath: extractProjectPath(mergeRequest),
    projectId: mergeRequest.project_id,
    sourceBranch: mergeRequest.source_branch,
    targetBranch: mergeRequest.target_branch,
    hasConflicts: Boolean(mergeRequest.has_conflicts),
    reviewers: (mergeRequest.reviewers ?? []).map(mapReviewer),
    updatedAt: mergeRequest.updated_at,
    createdAt: mergeRequest.created_at,
    blockers: { approvals, threads, pipeline },
    mergeability,
    responsiblePeople: computeResponsiblePeople(mergeRequest, mergeability, approvals),
  };
}

/** Obtiene el nombre completo del proyecto o construye un respaldo estable. */
async function fetchProjectPath(client: GitLabClient, projectId: string): Promise<string> {
  try {
    const { data } = await client.fetchWithLimit<GitLabProject>(`/projects/${projectId}`);
    return data.path_with_namespace;
  } catch {
    return `project-${projectId}`;
  }
}

/**
 * Consulta un proyecto sin impedir que los demás aparezcan si GitLab falla.
 */
async function fetchProjectMergeRequestsSafely(
  client: GitLabClient,
  projectId: string,
): Promise<GitLabMergeRequest[]> {
  try {
    return await fetchOpenMRsForProject(client, projectId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error al obtener MRs del proyecto ${projectId}:`, message);
    return [];
  }
}

/** Construye los metadatos que acompañan la respuesta del tablero. */
function buildMetadata(
  mergeRequests: EnrichedMergeRequest[],
  projectPaths: string[],
  viewerUsername: string | null,
): MergeRequestMetadata {
  return {
    fetchedAt: new Date().toISOString(),
    projectCount: projectPaths.length,
    totalMRs: mergeRequests.length,
    allProjects: projectPaths,
    people: collectPeople(mergeRequests),
    viewerUsername,
  };
}

/**
 * Consolida y ordena los merge requests de los proyectos que configuró una
 * persona, consultados con su propio access token.
 *
 * @param credentials Token y proyectos guardados en «Mi cuenta».
 * @returns Los merge requests enriquecidos y los metadatos de la consulta.
 */
async function getAllMergeRequests(credentials: GitLabCredentials): Promise<MergeRequestResponse> {
  const client = createGitLabClient(credentials.accessToken);
  const { projectIds } = credentials;

  const [projectResults, projectPaths] = await Promise.all([
    Promise.all(projectIds.map((projectId) => fetchProjectMergeRequestsSafely(client, projectId))),
    Promise.all(projectIds.map((projectId) => fetchProjectPath(client, projectId))),
  ]);

  const mergeRequests = await Promise.all(
    projectResults.flat().map((mergeRequest) => enrichMergeRequest(client, mergeRequest)),
  );
  mergeRequests.sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt));

  return {
    mergeRequests,
    meta: buildMetadata(mergeRequests, projectPaths, credentials.gitlabUsername),
  };
}

export { getAllMergeRequests };

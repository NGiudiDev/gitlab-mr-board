// 6. Imports relativos restantes.
import config from '../../../config.js';
import { createGitLabClient } from './gitlabApi.js';
import { collectPeople, computeMergeability, computeResponsiblePeople, extractProjectPath } from './mergeRequestRules.js';

/** Construye la ruta común de un merge request en la API de GitLab. */
function mergeRequestPath(projectId, mergeRequestIid) {
  return `/projects/${projectId}/merge_requests/${mergeRequestIid}`;
}

/** Obtiene los merge requests abiertos de un proyecto. */
async function fetchOpenMRsForProject(client, projectId) {
  return client.fetchPaginatedWithLimit(`/projects/${projectId}/merge_requests`, {
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
async function fetchApprovals(client, projectId, mergeRequestIid) {
  try {
    const { data } = await client.fetchWithLimit(
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
function hasUnresolvedNote({ notes = [] }) {
  return notes.some((note) => note.resolvable && !note.resolved);
}

/** Consulta la cantidad de discusiones pendientes de un merge request. */
async function fetchUnresolvedThreads(client, projectId, mergeRequestIid) {
  try {
    const discussions = await client.fetchPaginatedWithLimit(
      `${mergeRequestPath(projectId, mergeRequestIid)}/discussions`,
    );
    const unresolvedCount = discussions.filter(hasUnresolvedNote).length;

    return { status: unresolvedCount > 0 ? 'open' : 'resolved', unresolvedCount };
  } catch {
    return { status: 'unknown', unresolvedCount: 0 };
  }
}

/** Consulta el pipeline más reciente y usa `none` si no existe o falla. */
async function fetchPipeline(client, projectId, mergeRequestIid) {
  try {
    const { data } = await client.fetchWithLimit(
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
function mapReviewer(reviewer) {
  return {
    name: reviewer.name,
    username: reviewer.username,
    avatar: reviewer.avatar_url,
  };
}

/** Enriquece un merge request con sus bloqueos y clasificación. */
async function enrichMergeRequest(client, mergeRequest) {
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
async function fetchProjectPath(client, projectId) {
  try {
    const { data } = await client.fetchWithLimit(`/projects/${projectId}`);
    return data.path_with_namespace;
  } catch {
    return `project-${projectId}`;
  }
}

/**
 * Consulta un proyecto sin impedir que los demás aparezcan si GitLab falla.
 */
async function fetchProjectMergeRequestsSafely(client, projectId) {
  try {
    return await fetchOpenMRsForProject(client, projectId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error al obtener MRs del proyecto ${projectId}:`, message);
    return [];
  }
}

/**
 * Construye los metadatos que acompañan la respuesta del tablero.
 *
 * `viewerUsername` queda en `null`: la respuesta es de la cuenta y se guarda en
 * caché para todos sus miembros, así que quién la lee lo completa la ruta al
 * entregarla.
 */
function buildMetadata(mergeRequests, projectPaths) {
  return {
    fetchedAt: new Date().toISOString(),
    projectCount: projectPaths.length,
    totalMRs: mergeRequests.length,
    allProjects: projectPaths,
    people: collectPeople(mergeRequests),
    viewerUsername: null,
  };
}

/**
 * Consolida y ordena los merge requests de los proyectos que configuró la
 * cuenta, consultados con su access token.
 *
 * @param credentials Token y proyectos de la cuenta.
 * @returns Los merge requests enriquecidos y los metadatos de la consulta.
 */
async function getAllMergeRequests(credentials) {
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
    meta: buildMetadata(mergeRequests, projectPaths),
  };
}

export { getAllMergeRequests };

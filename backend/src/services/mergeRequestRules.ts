import type {
  ApprovalStatus,
  GitLabMergeRequest,
  Mergeability,
  PipelineStatus,
  ThreadStatus,
} from '../types.js';

/**
 * Clasifica un MR aplicando la primera regla coincidente. El orden importa:
 * `backlog` y `draft` ganan sobre cualquier bloqueo técnico porque el equipo
 * no espera trabajo sobre esos MRs.
 */
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

/**
 * Obtiene la ruta `grupo/proyecto` del MR. GitLab la expone en
 * `references.full` (`grupo/proyecto!12`); la URL es el respaldo cuando la API
 * no incluye ese campo.
 */
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

export { computeMergeability, extractProjectPath };

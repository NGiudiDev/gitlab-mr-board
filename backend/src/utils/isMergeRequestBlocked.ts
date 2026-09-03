import type { GitLabMergeRequest, PipelineStatus, ThreadStatus } from '../types.js';

/**
 * Estados de pipeline que cuentan como bloqueo. `running` y `pending` quedan
 * fuera a propósito: no bloquean el MR, sólo indican que todavía no terminó.
 */
const BLOCKING_PIPELINE_STATUSES = ['failed', 'canceled'];

/** Estados de pipeline que aún no dieron un resultado. */
const UNFINISHED_PIPELINE_STATUSES = ['running', 'pending'];

/**
 * Indica si un MR tiene un bloqueo técnico que impide avanzar: conflictos con
 * la rama destino, un pipeline fallido o cancelado, o discusiones sin resolver.
 */
function isMergeRequestBlocked(
  mr: GitLabMergeRequest,
  threads: ThreadStatus,
  pipeline: PipelineStatus,
): boolean {
  if (mr.has_conflicts) return true;

  if (BLOCKING_PIPELINE_STATUSES.includes(pipeline.status)) return true;

  return threads.status === 'open';
}

/**
 * Indica si un MR debe clasificarse como `mr_warning`. Un pipeline sin
 * terminar no es un bloqueo, pero tampoco permite avanzar a revisión: hasta
 * que dé un resultado el MR necesita la misma atención que uno bloqueado.
 */
function hasMergeRequestWarning(
  mr: GitLabMergeRequest,
  threads: ThreadStatus,
  pipeline: PipelineStatus,
): boolean {
  if (isMergeRequestBlocked(mr, threads, pipeline)) return true;

  return UNFINISHED_PIPELINE_STATUSES.includes(pipeline.status);
}

export { hasMergeRequestWarning, isMergeRequestBlocked };

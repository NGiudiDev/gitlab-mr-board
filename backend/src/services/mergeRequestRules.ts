import { hasMergeRequestWarning } from '../utils/isMergeRequestBlocked.js';

import type {
  ApprovalStatus,
  EnrichedMergeRequest,
  GitLabMergeRequest,
  Mergeability,
  MergeRequestPerson,
  PipelineStatus,
  ThreadStatus,
} from '../types.js';

/** Campos del contrato público que identifican a quienes participan del MR. */
type MergeRequestParticipants = Pick<EnrichedMergeRequest, 'author' | 'authorUsername' | 'reviewers'>;

/** Estados donde la acción pendiente corresponde al autor del merge request. */
const AUTHOR_RESPONSIBILITY_STATES = new Set<Mergeability>([
  'in_progress',
  'mr_warning',
  'qa',
  'ready_to_merge',
]);

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
  if (mr.draft || mr.work_in_progress) return 'in_progress';
  if (hasMergeRequestWarning(mr, threads, pipeline)) return 'mr_warning';
  if (labels.includes('qa_approved')) return 'ready_to_merge';
  if (approvals.status === 'pending') return 'review';
  if (labels.includes('qa_pending')) return 'qa';

  return 'unknown';
}

/**
 * Obtiene la ruta `grupo/proyecto` del MR. GitLab la expone en
 * `references.full` (`grupo/proyecto!12`); la URL es el respaldo cuando la API
 * no incluye ese campo.
 */
function extractProjectPath(mr: GitLabMergeRequest): string {
  const fallbackProjectPath = `project-${mr.project_id}`;
  const reference = mr.references?.full;

  if (reference) {
    const separatorIndex = reference.lastIndexOf('!');
    if (separatorIndex > -1) return reference.slice(0, separatorIndex);
  }

  try {
    const [projectPath] = new URL(mr.web_url).pathname.split('/-/merge_requests/');
    return projectPath?.replace(/^\//, '') || fallbackProjectPath;
  } catch {
    return fallbackProjectPath;
  }
}

/** Normaliza un username para comparaciones estables entre personas. */
function normalizeUsername(username: string | null | undefined): string {
  return username?.trim().toLowerCase() ?? '';
}

/** Construye la identidad del autor cuando GitLab la informa. */
function authorOf(mr: Pick<GitLabMergeRequest, 'author'>): MergeRequestPerson | null {
  const { author } = mr;
  if (!author?.username) return null;

  return { name: author.name, username: author.username };
}

/**
 * Calcula quiénes tienen la acción pendiente sobre un merge request. En Code
 * Review la responsabilidad es de los reviewers que todavía no aprobaron y
 * vuelve al autor cuando ya aprobaron todos; `backlog` y `unknown` no esperan
 * trabajo de nadie.
 */
function computeResponsiblePeople(
  mr: GitLabMergeRequest,
  mergeability: Mergeability,
  approvals: ApprovalStatus,
): MergeRequestPerson[] {
  const author = authorOf(mr);

  if (AUTHOR_RESPONSIBILITY_STATES.has(mergeability)) return author ? [author] : [];
  if (mergeability !== 'review') return [];

  const reviewers = mr.reviewers ?? [];
  if (reviewers.length === 0) return [];

  const approvers = new Set((approvals.approvers ?? []).map(normalizeUsername));
  const pendingReviewers = reviewers.filter(
    (reviewer) => !approvers.has(normalizeUsername(reviewer.username)),
  );

  if (pendingReviewers.length > 0) {
    return pendingReviewers.map(({ name, username }) => ({ name, username }));
  }

  return author ? [author] : [];
}

/** Ordena a las personas por nombre visible y desempata por username. */
function comparePeople(first: MergeRequestPerson, second: MergeRequestPerson): number {
  return first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
    || first.username.localeCompare(second.username, 'es', { sensitivity: 'base' });
}

/**
 * Reúne autores y reviewers de los merge requests consultados. La lista
 * alimenta el selector de la vista personal, así que no repite usernames.
 */
function collectPeople(mergeRequests: MergeRequestParticipants[]): MergeRequestPerson[] {
  const peopleByUsername = new Map<string, MergeRequestPerson>();

  mergeRequests.forEach((mr) => {
    const author = mr.authorUsername
      ? [{ name: mr.author, username: mr.authorUsername }]
      : [];

    [...author, ...mr.reviewers].forEach(({ name, username }) => {
      const key = normalizeUsername(username);
      if (key && !peopleByUsername.has(key)) peopleByUsername.set(key, { name, username });
    });
  });

  return [...peopleByUsername.values()].sort(comparePeople);
}

export {
  collectPeople,
  computeMergeability,
  computeResponsiblePeople,
  extractProjectPath,
  normalizeUsername,
};

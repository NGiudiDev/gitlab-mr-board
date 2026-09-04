/**
 * Fixtures con la forma que devuelve `GET /api/pull-requests`.
 * Cada prueba sobrescribe sólo los campos que le importan.
 */

const DEFAULT_APPROVALS = {
  status: 'approved',
  required: 2,
  given: 2,
  approvers: ['ana', 'lider'],
  hasLeadApproval: true,
}

/**
 * Los responsables los calcula el backend, así que el fixture no reproduce la
 * regla: por omisión asigna al autor y cada prueba pasa `responsiblePeople`
 * cuando necesita otra combinación.
 */
function buildMergeRequest(overrides = {}) {
  const mergeRequest = {
    id: '101-1',
    iid: 1,
    title: 'Agregar filtro por autor',
    url: 'https://gitlab.example.com/equipo/tablero/-/merge_requests/1',
    author: 'Ana Pérez',
    authorUsername: 'ana',
    authorAvatar: null,
    projectPath: 'equipo/tablero',
    projectId: 101,
    sourceBranch: 'feature/filtro-autor',
    targetBranch: 'main',
    labels: ['qa_approved'],
    isDraft: false,
    hasConflicts: false,
    reviewers: [],
    updatedAt: '2026-08-28T10:00:00.000Z',
    createdAt: '2026-08-27T10:00:00.000Z',
    mergeability: 'ready_to_merge',
    ...overrides,
    blockers: {
      approvals: { ...DEFAULT_APPROVALS },
      threads: { status: 'resolved', unresolvedCount: 0 },
      pipeline: { status: 'success', pipelineUrl: 'https://gitlab.example.com/pipe/1' },
      ...(overrides.blockers ?? {}),
    },
  }

  return {
    ...mergeRequest,
    responsiblePeople: overrides.responsiblePeople ?? (mergeRequest.authorUsername
      ? [{ name: mergeRequest.author, username: mergeRequest.authorUsername }]
      : []),
  }
}

/** Personas del selector, sin duplicar usernames, como las arma el backend. */
function collectPeople(mergeRequests) {
  const peopleByUsername = new Map()

  mergeRequests.forEach((mr) => {
    const author = mr.authorUsername
      ? [{ name: mr.author, username: mr.authorUsername }]
      : []
    const participants = [...author, ...mr.reviewers]

    participants.forEach(({ name, username }) => {
      if (!peopleByUsername.has(username)) peopleByUsername.set(username, { name, username })
    })
  })

  return [...peopleByUsername.values()]
}

function buildResponse(mergeRequests = [], meta = {}) {
  const allProjects = meta.allProjects
    ?? [...new Set(mergeRequests.map((mr) => mr.projectPath))]

  return {
    mergeRequests,
    meta: {
      fetchedAt: '2026-08-28T12:00:00.000Z',
      projectCount: allProjects.length,
      totalMRs: mergeRequests.length,
      allProjects,
      people: collectPeople(mergeRequests),
      ...meta,
    },
  }
}

export { buildMergeRequest, buildResponse }

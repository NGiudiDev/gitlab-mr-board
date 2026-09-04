const AUTHOR_RESPONSIBILITY_STATES = new Set([
  'in_progress',
  'mr_warning',
  'qa',
  'ready_to_merge',
])

/** Normaliza un username para comparaciones estables. */
function normalizeUsername(username) {
  return username?.trim().toLowerCase() ?? ''
}

/**
 * Busca una persona por username sin distinguir mayúsculas ni espacios.
 *
 * @param {Array<{name: string, username: string}>} people Personas disponibles.
 * @param {string|null|undefined} username Identidad que se busca.
 * @returns {{name: string, username: string}|null} Persona encontrada.
 */
function findPersonByUsername(people, username) {
  const normalizedUsername = normalizeUsername(username)
  if (!normalizedUsername) return null

  return people.find(
    (person) => normalizeUsername(person.username) === normalizedUsername,
  ) ?? null
}

/** Construye la identidad del autor cuando el contrato incluye su username. */
function authorOf(mr) {
  if (!mr.authorUsername) return null
  return { name: mr.author, username: mr.authorUsername }
}

/**
 * Devuelve las personas que deben actuar sobre un merge request.
 *
 * @param {object} mr Merge request enriquecido por el backend.
 * @returns {Array<{name: string, username: string}>} Responsables actuales.
 */
function responsiblePeopleOf(mr) {
  if (AUTHOR_RESPONSIBILITY_STATES.has(mr.mergeability)) {
    const author = authorOf(mr)
    return author ? [author] : []
  }

  if (mr.mergeability !== 'review') return []

  const reviewers = mr.reviewers || []
  if (reviewers.length === 0) return []

  const approvers = new Set(
    (mr.blockers.approvals.approvers || []).map(normalizeUsername),
  )
  const pendingReviewers = reviewers.filter(
    (reviewer) => !approvers.has(normalizeUsername(reviewer.username)),
  )

  if (pendingReviewers.length > 0) {
    return pendingReviewers.map(({ name, username }) => ({ name, username }))
  }

  const author = authorOf(mr)
  return author ? [author] : []
}

/**
 * Reúne autores y reviewers disponibles para el selector personal.
 *
 * @param {Array<object>} mergeRequests Respuesta consolidada del backend.
 * @returns {Array<{name: string, username: string}>} Personas sin duplicados.
 */
function peopleFromMergeRequests(mergeRequests) {
  const peopleByUsername = new Map()

  mergeRequests.forEach((mr) => {
    const author = authorOf(mr)
    const people = [...(author ? [author] : []), ...(mr.reviewers || [])]
    people.forEach((person) => {
      const key = normalizeUsername(person.username)
      if (key && !peopleByUsername.has(key)) {
        peopleByUsername.set(key, { name: person.name, username: person.username })
      }
    })
  })

  return [...peopleByUsername.values()].sort((first, second) => (
    first.name.localeCompare(second.name, 'es', { sensitivity: 'base' })
      || first.username.localeCompare(second.username, 'es', { sensitivity: 'base' })
  ))
}

/** Filtra los merge requests donde el username indicado es responsable. */
function mergeRequestsForPerson(mergeRequests, username) {
  const normalizedUsername = normalizeUsername(username)
  if (!normalizedUsername) return []

  return mergeRequests.filter((mr) => responsiblePeopleOf(mr).some(
    (person) => normalizeUsername(person.username) === normalizedUsername,
  ))
}

export {
  findPersonByUsername,
  mergeRequestsForPerson,
  normalizeUsername,
  peopleFromMergeRequests,
  responsiblePeopleOf,
}

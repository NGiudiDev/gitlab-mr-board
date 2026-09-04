/**
 * Selección de datos para la vista personal. Las reglas de responsabilidad
 * viven en el backend: acá sólo se elige qué mostrar de lo que ya llegó
 * resuelto en `responsiblePeople` y en `meta.people`.
 */

/**
 * Busca una persona dentro de la lista informada por el backend.
 *
 * @param {Array<{name: string, username: string}>} people Personas disponibles.
 * @param {string|null|undefined} username Identidad seleccionada.
 * @returns {{name: string, username: string}|null} Persona encontrada.
 */
function findPersonByUsername(people, username) {
  if (!username) return null

  return people.find((person) => person.username === username) ?? null
}

/**
 * Filtra los merge requests donde el backend marcó responsable al username.
 *
 * @param {Array<object>} mergeRequests Merge requests recibidos del backend.
 * @param {string|null|undefined} username Identidad seleccionada.
 * @returns {Array<object>} Merge requests de esa persona.
 */
function mergeRequestsForPerson(mergeRequests, username) {
  if (!username) return []

  return mergeRequests.filter((mr) => mr.responsiblePeople.some(
    (person) => person.username === username,
  ))
}

export { findPersonByUsername, mergeRequestsForPerson }

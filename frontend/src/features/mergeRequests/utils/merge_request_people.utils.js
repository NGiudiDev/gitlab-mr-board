/**
 * Enumera a las personas que el backend marcó responsables.
 *
 * @param {Array<{name: string}>} responsiblePeople Responsables del merge request.
 * @returns {string} Nombres separados por coma, o vacío si no hay ninguno.
 */
export function formatResponsiblePeople(responsiblePeople = []) {
  return responsiblePeople.map((person) => person.name).join(", ");
}

const MERGE_REQUEST_COLUMNS = [
  { id: 'in_progress', name: 'En progreso' },
  { id: 'mr_warning', name: 'Pendientes' },
  { id: 'review', name: 'Code Review' },
  { id: 'qa', name: 'QA' },
  { id: 'ready_to_merge', name: 'Listas para mergear' },
  { id: 'backlog', name: 'Pausados' },
]

/**
 * Distribuye merge requests en las columnas visibles del tablero.
 *
 * @param {Array<object>} mergeRequests Merge requests a distribuir.
 * @returns {Array<object>} Columnas con sus merge requests correspondientes.
 */
function columnsOf(mergeRequests) {
  return MERGE_REQUEST_COLUMNS.map((column) => ({
    ...column,
    mergeRequests: mergeRequests.filter((mr) => mr.mergeability === column.id),
  }))
}

export { columnsOf }

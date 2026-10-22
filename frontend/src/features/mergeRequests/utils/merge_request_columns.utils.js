import { MERGE_REQUEST_COLUMNS } from "../constants/merge_request_columns.consts.js";

/**
 * Distribuye merge requests en las columnas visibles del tablero.
 *
 * La clasificación llega resuelta del backend en `mergeability`: acá sólo se
 * agrupa por ella.
 *
 * @param {Array<object>} mergeRequests Merge requests a distribuir.
 * @returns {Array<object>} Columnas con sus merge requests correspondientes.
 */
export function splitIntoColumns(mergeRequests) {
  return MERGE_REQUEST_COLUMNS.map((column) => ({
    ...column,
    mergeRequests: mergeRequests.filter((mr) => mr.mergeability === column.id),
  }));
}

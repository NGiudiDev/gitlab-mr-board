import { getState, resetStore } from '../src/features/mergeRequests/hooks/useMergeRequests.js'

/**
 * El store mantiene un estado de módulo compartido por toda la app, así que
 * cada prueba debe dejarlo como al arrancar.
 */
function resetSharedState() {
  resetStore()
  return getState()
}

/** Respuesta exitosa de `fetch` con el cuerpo indicado. */
function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

export { jsonResponse, resetSharedState }

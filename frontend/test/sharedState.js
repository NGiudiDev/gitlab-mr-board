import { useMergeRequests } from '../src/features/mergeRequests/composables/useMergeRequests.js'

/**
 * El composable mantiene un estado de módulo compartido por toda la app.
 * Fuera de un componente, `onMounted` no se ejecuta, así que esto sólo da
 * acceso a los refs sin disparar la carga inicial ni el polling.
 */
function getSharedState() {
  const originalWarn = console.warn
  console.warn = () => {}
  try {
    return useMergeRequests()
  } finally {
    console.warn = originalWarn
  }
}

/** Deja el estado compartido como al arrancar la app. */
function resetSharedState() {
  const state = getSharedState()
  state.mergeRequests.value = []
  state.meta.value = null
  state.loading.value = false
  state.error.value = null
  state.lastFetched.value = null
  state.searchQuery.value = ''
  return state
}

/** Respuesta exitosa de `fetch` con el cuerpo indicado. */
function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

export { getSharedState, jsonResponse, resetSharedState }

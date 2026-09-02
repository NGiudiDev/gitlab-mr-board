import { useEffect, useMemo, useSyncExternalStore } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const POLL_INTERVAL = 5 * 60 * 1000

const INITIAL_STATE = {
  mergeRequests: [],
  meta: null,
  loading: false,
  error: null,
  lastFetched: null,
  searchQuery: '',
}

/**
 * El estado vive a nivel de módulo, compartido por toda la app.
 * `useSyncExternalStore` lo conecta a React sin provider ni librería de
 * estado: el store es la fuente de verdad y los componentes se suscriben.
 */
let state = INITIAL_STATE
const listeners = new Set()

function getState() {
  return state
}

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

let pollTimer = null
let consumers = 0
// Carga inicial en curso. Evita que el doble montaje de StrictMode, o un
// segundo consumidor del hook, disparen dos peticiones para el mismo arranque.
let initialLoad = null

async function fetchMergeRequests(force = false) {
  setState({ loading: true, error: null })
  try {
    const url = `${API_BASE}/api/pull-requests${force ? '?force=true' : ''}`
    const response = await fetch(url)
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || `Error ${response.status}`)
    }
    const data = await response.json()
    setState({ mergeRequests: data.mergeRequests, meta: data.meta, lastFetched: new Date() })
  } catch (err) {
    setState({ error: err.message })
  } finally {
    setState({ loading: false })
  }
}

function loadOnce() {
  if (initialLoad) return initialLoad

  initialLoad = fetchMergeRequests().finally(() => {
    initialLoad = null
  })
  return initialLoad
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(() => fetchMergeRequests(), POLL_INTERVAL)
}

function stopPolling() {
  if (!pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
}

function setSearchQuery(searchQuery) {
  setState({ searchQuery })
}

/** Filtra por título, autor, ramas y ruta del proyecto. Función pura. */
function filterMergeRequests(mergeRequests, searchQuery) {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return mergeRequests

  return mergeRequests.filter((mr) => {
    const haystack = `${mr.title} ${mr.author} ${mr.sourceBranch} ${mr.targetBranch} ${mr.projectPath}`.toLowerCase()
    return haystack.includes(query)
  })
}

function getFilteredMergeRequests() {
  return filterMergeRequests(state.mergeRequests, state.searchQuery)
}

/** Deja el store como al arrancar la app. Sólo para pruebas. */
function resetStore() {
  stopPolling()
  consumers = 0
  initialLoad = null
  setState(INITIAL_STATE)
}

function useMergeRequests() {
  const snapshot = useSyncExternalStore(subscribe, getState)

  useEffect(() => {
    consumers += 1
    loadOnce()
    startPolling()

    return () => {
      consumers -= 1
      // El polling es del store, no del componente: sólo se detiene cuando ya
      // no queda nadie escuchando.
      if (consumers === 0) stopPolling()
    }
  }, [])

  const filteredMRs = useMemo(
    () => filterMergeRequests(snapshot.mergeRequests, snapshot.searchQuery),
    [snapshot.mergeRequests, snapshot.searchQuery],
  )

  return { ...snapshot, filteredMRs, fetchMRs: fetchMergeRequests, setSearchQuery }
}

export {
  fetchMergeRequests,
  filterMergeRequests,
  getFilteredMergeRequests,
  getState,
  resetStore,
  setSearchQuery,
  subscribe,
  useMergeRequests,
}

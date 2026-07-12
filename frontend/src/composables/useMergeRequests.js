import { ref, computed, onMounted, onUnmounted } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const POLL_INTERVAL = 5 * 60 * 1000

const mergeRequests = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref(null)
const lastFetched = ref(null)
const searchQuery = ref('')

const filteredMRs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return mergeRequests.value
  return mergeRequests.value.filter((mr) => {
    const haystack = `${mr.title} ${mr.author} ${mr.sourceBranch} ${mr.targetBranch} ${mr.projectPath}`.toLowerCase()
    return haystack.includes(q)
  })
})

let pollTimer = null

async function fetchMRs(force = false) {
  loading.value = true
  error.value = null
  try {
    const url = `${API_BASE}/api/pull-requests${force ? '?force=true' : ''}`
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Error ${res.status}`)
    }
    const data = await res.json()
    mergeRequests.value = data.mergeRequests
    meta.value = data.meta
    lastFetched.value = new Date()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => fetchMRs(), POLL_INTERVAL)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function useMergeRequests() {
  onMounted(() => {
    fetchMRs()
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    mergeRequests,
    meta,
    loading,
    error,
    lastFetched,
    searchQuery,
    filteredMRs,
    fetchMRs,
  }
}

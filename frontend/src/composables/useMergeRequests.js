import { ref, computed, onMounted, onUnmounted } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const POLL_INTERVAL = 5 * 60 * 1000

const mergeRequests = ref([])
const meta = ref(null)
const loading = ref(false)
const error = ref(null)
const lastFetched = ref(null)
const searchQuery = ref('')
const activeProjects = ref(null)

const projects = computed(() => {
  const set = new Set(mergeRequests.value.map((mr) => mr.projectPath))
  return [...set].sort()
})

const filteredMRs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return mergeRequests.value.filter((mr) => {
    if (activeProjects.value && !activeProjects.value.has(mr.projectPath)) return false
    if (!q) return true
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

    if (activeProjects.value === null) {
      activeProjects.value = new Set(data.mergeRequests.map((mr) => mr.projectPath))
    }
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

function toggleProject(project) {
  if (!activeProjects.value) return
  if (activeProjects.value.has(project)) {
    activeProjects.value.delete(project)
  } else {
    activeProjects.value.add(project)
  }
  activeProjects.value = new Set(activeProjects.value)
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
    activeProjects,
    projects,
    filteredMRs,
    fetchMRs,
    toggleProject,
  }
}

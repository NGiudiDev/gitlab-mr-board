<template>
  <div class="px-5 py-5 max-w-[1600px] mx-auto">
    <TopBar
      :meta="meta"
      :loading="loading"
      :error="error"
      :last-fetched="lastFetched"
      @refresh="fetchMRs(true)"
    />

    <div v-if="error && mergeRequests.length === 0" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
      <p class="mb-2">No se pudo conectar al backend.</p>
      <p class="text-conflict text-[12px]">{{ error }}</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-between gap-4 flex-wrap mb-3">
        <div class="flex gap-1 bg-surface border border-border rounded-lg p-0.5">
          <button
            v-for="tab in viewTabs"
            :key="tab.id"
            @click="viewMode = tab.id"
            :class="viewMode === tab.id ? 'bg-surface-raised text-text-primary' : 'text-text-muted'"
            class="text-[12.5px] px-3 py-1.5 rounded-md cursor-pointer"
          >
            {{ tab.label }}
          </button>
        </div>
        <SearchBar v-model="searchQuery" />
      </div>

      <FilterChips
        :projects="projects"
        :active-projects="activeProjects"
        @toggle="toggleProject"
      />

      <div class="mt-3.5">
        <div v-if="loading && mergeRequests.length === 0" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
          Cargando merge requests...
        </div>
        <div v-else-if="filteredMRs.length === 0" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
          Ninguna MR coincide con los filtros actuales.
        </div>
        <MrBoard v-else :merge-requests="filteredMRs" :view-mode="viewMode" />
      </div>

      <div v-if="lastFetched" class="text-[11.5px] text-text-faint mt-4">
        Última actualización: {{ lastFetched.toLocaleTimeString('es-AR') }} · {{ meta?.totalMRs || 0 }} MRs en total · Próxima actualización automática en 5 min
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMergeRequests } from './composables/useMergeRequests.js'
import TopBar from './components/TopBar.vue'
import SearchBar from './components/SearchBar.vue'
import FilterChips from './components/FilterChips.vue'
import MrBoard from './components/MrBoard.vue'

const {
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
} = useMergeRequests()

const viewMode = ref('project')
const viewTabs = [
  { id: 'project', label: 'Por proyecto' },
  { id: 'status', label: 'Por estado' },
]
</script>

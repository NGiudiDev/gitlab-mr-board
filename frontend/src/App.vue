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
      <div class="flex items-center justify-end mb-3">
        <SearchBar v-model="searchQuery" />
      </div>

      <div>
        <div v-if="loading && mergeRequests.length === 0" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
          Cargando merge requests...
        </div>
        <div v-else-if="filteredMRs.length === 0 && !(meta?.allProjects?.length)" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
          Ninguna MR coincide con los filtros actuales.
        </div>
        <MrBoard v-else :merge-requests="filteredMRs" :all-projects="meta?.allProjects || []" />
      </div>

      <div v-if="lastFetched" class="text-[11.5px] text-text-faint mt-4">
        Última actualización: {{ lastFetched.toLocaleTimeString('es-AR') }} · {{ meta?.totalMRs || 0 }} MRs en total · Próxima actualización automática en 5 min
      </div>
    </template>
  </div>
</template>

<script setup>
import { useMergeRequests } from './composables/useMergeRequests.js'
import TopBar from './components/TopBar.vue'
import SearchBar from './components/SearchBar.vue'
import MrBoard from './components/MrBoard.vue'

const {
  mergeRequests,
  meta,
  loading,
  error,
  lastFetched,
  searchQuery,
  filteredMRs,
  fetchMRs,
} = useMergeRequests()
</script>

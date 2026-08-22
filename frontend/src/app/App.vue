<template>
  <a href="#contenido-principal" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-bg">
    Saltar al contenido principal
  </a>
  <main id="contenido-principal" class="px-5 py-5 max-w-[1600px] mx-auto" tabindex="-1">
    <TopBar
      :meta="meta"
      :loading="loading"
      :error="error"
      :last-fetched="lastFetched"
      @refresh="fetchMRs(true)"
    />

    <div v-if="error && mergeRequests.length === 0" role="alert" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
      <p class="mb-2">No se pudo conectar al backend.</p>
      <p class="text-conflict text-[12px]">{{ error }}</p>
    </div>

    <template v-else>
      <div class="flex items-center justify-end mb-3">
        <SearchBar v-model="searchQuery" />
      </div>

      <section aria-labelledby="tablero-heading">
        <h2 id="tablero-heading" class="sr-only">Merge requests por proyecto y estado</h2>
        <div v-if="loading && mergeRequests.length === 0" role="status" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
          Cargando merge requests...
        </div>
        <div v-else-if="filteredMRs.length === 0" role="status" class="text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface">
          Ninguna MR coincide con los filtros actuales.
        </div>
        <MrBoard v-else :merge-requests="filteredMRs" :all-projects="meta?.allProjects || []" />
      </section>

      <p v-if="lastFetched" class="text-[12px] text-text-faint mt-4">
        Última actualización: {{ lastFetched.toLocaleTimeString('es-AR') }} · {{ meta?.totalMRs || 0 }} MRs en total · Próxima actualización automática en 5 min
      </p>
    </template>
    <p class="sr-only" aria-live="polite" aria-atomic="true">{{ statusAnnouncement }}</p>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useMergeRequests } from '../features/mergeRequests/composables/useMergeRequests.js'
import TopBar from '../features/mergeRequests/components/TopBar.vue'
import SearchBar from '../features/mergeRequests/components/SearchBar.vue'
import MrBoard from '../features/mergeRequests/components/MrBoard.vue'

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

const statusAnnouncement = computed(() => {
  if (loading.value) return 'Actualizando merge requests.'
  if (error.value) return `No se pudieron actualizar los datos: ${error.value}`
  if (!lastFetched.value) return ''
  return `Actualización completa. Se muestran ${filteredMRs.value.length} de ${meta.value?.totalMRs || 0} merge requests.`
})
</script>

<template>
  <div class="flex items-center justify-between gap-4 flex-wrap mb-4">
    <div>
      <h1 class="text-lg font-semibold">Tablero de MRs</h1>
      <div class="text-[12.5px] font-mono text-text-muted">
        <template v-if="meta">
          {{ meta.projectCount }} proyectos · {{ meta.totalMRs }} MRs abiertas
        </template>
        <template v-else>Cargando...</template>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1.5 text-[12px] text-text-muted px-2.5 py-1 border border-border rounded-full bg-surface">
        <span :class="dotClass" class="w-[7px] h-[7px] rounded-full flex-none"></span>
        <span v-if="loading">Actualizando...</span>
        <span v-else-if="error">Error</span>
        <span v-else-if="lastFetched">{{ formatTime(lastFetched) }}</span>
        <span v-else>Sin datos</span>
      </span>
      <button
        @click="$emit('refresh')"
        :disabled="loading"
        class="text-[13px] px-3 py-1.5 rounded-md bg-surface-raised border border-border text-text-primary hover:border-text-faint disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        Refrescar ahora
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  lastFetched: { type: Date, default: null },
})

defineEmits(['refresh'])

const dotClass = computed(() => {
  if (props.loading) return 'bg-draft'
  if (props.error) return 'bg-conflict'
  if (props.lastFetched) return 'bg-ready'
  return 'bg-text-faint'
})

function formatTime(date) {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
</script>

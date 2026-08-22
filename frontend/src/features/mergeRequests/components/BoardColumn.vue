<template>
  <section class="bg-surface-raised border border-border-soft rounded-lg min-w-[250px] max-w-[250px] flex flex-col" :aria-labelledby="headingId">
    <div class="px-3 py-2 border-b border-border-soft flex items-center justify-between">
      <h3 :id="headingId" class="text-[12px] font-semibold text-text-muted">{{ title }}</h3>
      <span class="text-[10.5px] text-text-faint bg-surface px-1.5 py-0.5 rounded-full">
        <span aria-hidden="true">{{ mergeRequests.length }}</span>
        <span class="sr-only">{{ mergeRequests.length }} merge requests</span>
      </span>
    </div>
    <ul class="overflow-y-auto p-2 flex flex-col gap-2 max-h-[60vh]" role="list">
      <li v-for="mr in mergeRequests" :key="mr.id">
        <MrCard :mr="mr" />
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import MrCard from './MrCard.vue'

const props = defineProps({
  title: { type: String, required: true },
  idPrefix: { type: String, required: true },
  mergeRequests: { type: Array, required: true },
})

const headingId = computed(() => `columna-${props.idPrefix}-${props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
</script>

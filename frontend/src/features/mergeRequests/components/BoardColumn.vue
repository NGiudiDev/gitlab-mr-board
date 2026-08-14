<template>
  <div class="bg-surface-raised border border-border-soft rounded-lg min-w-[250px] max-w-[250px] flex flex-col">
    <div class="px-3 py-2 border-b border-border-soft flex items-center justify-between">
      <span class="text-[12px] font-semibold text-text-muted">{{ title }}</span>
      <span class="text-[10.5px] text-text-faint bg-surface px-1.5 py-0.5 rounded-full">
        {{ mergeRequests.length }}
      </span>
    </div>
    <div class="overflow-y-auto p-2 flex flex-col gap-2 max-h-[60vh]">
      <MrCard v-for="mr in mergeRequests" :key="mr.id" :mr="mr" />
    </div>
  </div>
</template>

<script setup>
import MrCard from './MrCard.vue'

defineProps({
  title: { type: String, required: true },
  mergeRequests: { type: Array, required: true },
})
</script>

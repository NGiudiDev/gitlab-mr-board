<template>
  <div class="bg-surface border border-border rounded-lg min-w-[290px] max-w-[290px] flex flex-col max-h-[74vh]">
    <div class="px-3 py-2.5 border-b border-border-soft flex items-center justify-between">
      <span class="text-[12.5px] font-semibold flex items-center gap-1.5">
        <span class="text-text-faint font-bold">›</span>
        {{ title }}
      </span>
      <span class="text-[11px] text-text-muted bg-surface-raised px-2 py-0.5 rounded-full">
        {{ mergeRequests.length }}
      </span>
    </div>
    <div class="overflow-y-auto p-2 flex flex-col gap-2">
      <MrCard v-for="mr in mergeRequests" :key="mr.id" :mr="mr" />
      <div v-if="mergeRequests.length === 0" class="text-[12px] text-text-faint text-center py-5">
        Sin MRs
      </div>
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

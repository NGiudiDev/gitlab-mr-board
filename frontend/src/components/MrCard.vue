<template>
  <div :class="cardClasses" class="rounded-md p-2.5 px-3 border border-border-soft">
    <a :href="mr.url" target="_blank" rel="noopener" class="text-[13px] leading-snug block mb-1.5">
      {{ mr.title }}
    </a>

    <div class="font-mono text-[10.5px] text-text-faint truncate">
      {{ mr.sourceBranch }} → {{ mr.targetBranch }}
    </div>

    <div class="flex items-center gap-1.5 mt-2 flex-wrap">
      <BlockerBadge type="pipeline" :data="mr.blockers.pipeline" />
      <BlockerBadge type="threads" :data="mr.blockers.threads" />
      <BlockerBadge type="approvals" :data="mr.blockers.approvals" />
    </div>

    <div class="flex items-center justify-between mt-2 gap-2">
      <span class="text-[11px] text-text-muted truncate">{{ mr.author }} · {{ timeAgo(mr.updatedAt) }}</span>
      <span v-if="mr.isDraft" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface text-text-muted">Draft</span>
      <span v-if="mr.hasConflicts" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-conflict-soft text-conflict">Conflicto</span>
    </div>

    <div v-if="mr.labels.length" class="flex flex-wrap gap-1 mt-2">
      <span
        v-for="label in mr.labels.slice(0, 4)"
        :key="label"
        class="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BlockerBadge from './BlockerBadge.vue'

const props = defineProps({
  mr: { type: Object, required: true },
})

const cardClasses = computed(() => {
  const base = 'bg-surface-raised border-l-[3px]'
  const colorMap = {
    green: 'border-l-ready',
    yellow: 'border-l-draft',
    red: 'border-l-conflict',
    gray: 'border-l-text-faint',
  }
  return `${base} ${colorMap[props.mr.mergeability] || 'border-l-text-faint'}`
})

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m`
  if (diff < 86400) return `${Math.round(diff / 3600)}h`
  return `${Math.round(diff / 86400)}d`
}
</script>

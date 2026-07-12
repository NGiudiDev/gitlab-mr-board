<template>
  <div class="flex flex-col gap-4">
    <div v-for="group in repoGroups" :key="group.repo" class="border border-border rounded-lg bg-surface overflow-hidden">
      <button
        @click="toggle(group.repo)"
        class="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-surface-raised"
      >
        <span class="text-[11px] text-text-faint transition-transform" :class="isExpanded(group.repo) ? 'rotate-90' : ''">▶</span>
        <span class="text-[13px] font-semibold text-text-primary font-mono">{{ group.repo }}</span>
        <span class="text-[11px] text-text-muted bg-surface-raised px-2 py-0.5 rounded-full ml-1">
          {{ group.mrs.length }}
        </span>
      </button>
      <div v-show="isExpanded(group.repo)" class="flex gap-3 overflow-x-auto p-3 border-t border-border-soft">
        <BoardColumn
          v-for="col in getColumns(group.mrs)"
          :key="col.id"
          :title="col.name"
          :merge-requests="col.mrs"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BoardColumn from './BoardColumn.vue'

const props = defineProps({
  mergeRequests: { type: Array, required: true },
  allProjects: { type: Array, default: () => [] },
})

const STATUS_ORDER = [
  { id: 'gray', name: 'Draft' },
  { id: 'red', name: 'Bloqueadas' },
  { id: 'yellow', name: 'Pendientes' },
  { id: 'review', name: 'Code Review' },
  { id: 'attention', name: 'Requiere atención' },
  { id: 'green', name: 'Listas para mergear' },
  { id: 'backlog', name: 'Despriorizado' },
]

const expanded = ref({})

function isExpanded(repo) {
  return !!expanded.value[repo]
}

function toggle(repo) {
  expanded.value[repo] = !expanded.value[repo]
}

const repoGroups = computed(() => {
  const byRepo = {}
  props.allProjects.forEach((p) => { byRepo[p] = [] })
  props.mergeRequests.forEach((mr) => {
    if (!byRepo[mr.projectPath]) byRepo[mr.projectPath] = []
    byRepo[mr.projectPath].push(mr)
  })
  return Object.keys(byRepo)
    .sort()
    .map((repo) => ({ repo, mrs: byRepo[repo] }))
})

function getColumns(mrs) {
  return STATUS_ORDER.map((col) => ({
    ...col,
    mrs: mrs.filter((mr) => mr.mergeability === col.id),
  }))
}
</script>

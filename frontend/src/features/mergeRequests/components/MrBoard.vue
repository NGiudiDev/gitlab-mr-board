<template>
  <div class="flex flex-col gap-4">
    <section v-for="group in repoGroups" :key="group.repo" class="border border-border rounded-lg bg-surface overflow-hidden" :aria-labelledby="repoHeadingId(group.repo)">
      <button
        @click="toggle(group.repo)"
        :aria-expanded="isExpanded(group.repo)"
        :aria-controls="repoPanelId(group.repo)"
        class="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <span class="text-[11px] text-text-faint transition-transform" :class="isExpanded(group.repo) ? 'rotate-90' : ''" aria-hidden="true">▶</span>
        <span :id="repoHeadingId(group.repo)" class="text-[13px] font-semibold text-text-primary font-mono">{{ group.repo }}</span>
        <span class="text-[11px] text-text-muted bg-surface-raised px-2 py-0.5 rounded-full ml-1">
          {{ group.mrs.length }} <span class="sr-only">merge requests</span>
        </span>
      </button>
      <div :id="repoPanelId(group.repo)" v-show="isExpanded(group.repo)" class="flex gap-3 overflow-x-auto p-3 border-t border-border-soft" tabindex="0" aria-label="Columnas del proyecto">
        <BoardColumn
          v-for="col in getColumns(group.mrs)"
          :key="col.id"
          :title="col.name"
          :id-prefix="repoDomId(group.repo)"
          :merge-requests="col.mrs"
        />
      </div>
    </section>
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
  { id: 'yellow', name: 'Pendientes' },
  { id: 'review', name: 'Code Review' },
  { id: 'qa', name: 'QA' },
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

function repoDomId(repo) {
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function repoHeadingId(repo) {
  return `proyecto-${repoDomId(repo)}`
}

function repoPanelId(repo) {
  return `panel-${repoDomId(repo)}`
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

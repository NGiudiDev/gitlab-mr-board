<template>
  <div class="flex gap-3.5 overflow-x-auto pb-3">
    <BoardColumn
      v-for="col in columns"
      :key="col.id"
      :title="col.name"
      :merge-requests="col.mrs"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BoardColumn from './BoardColumn.vue'

const props = defineProps({
  mergeRequests: { type: Array, required: true },
  viewMode: { type: String, default: 'project' },
})

const isBacklog = (mr) => mr.labels.some((l) => l.toLowerCase() === 'backlog')

const columns = computed(() => {
  const mrs = props.mergeRequests
  if (props.viewMode === 'status') {
    const backlogMrs = mrs.filter(isBacklog)
    const activeMrs = mrs.filter((mr) => !isBacklog(mr))
    const order = [
      { id: 'gray', name: 'Draft' },
      { id: 'red', name: 'Bloqueadas' },
      { id: 'yellow', name: 'Pendientes' },
      { id: 'green', name: 'Listas para mergear' },
    ]
    const cols = order.map((col) => ({
      ...col,
      mrs: activeMrs.filter((mr) => mr.mergeability === col.id),
    }))
    cols.push({ id: 'backlog', name: 'Despriorizado', mrs: backlogMrs })
    return cols
  }

  const byProject = {}
  mrs.forEach((mr) => {
    if (!byProject[mr.projectPath]) byProject[mr.projectPath] = []
    byProject[mr.projectPath].push(mr)
  })
  return Object.keys(byProject)
    .sort()
    .map((p) => ({ id: p, name: p, mrs: byProject[p] }))
})
</script>

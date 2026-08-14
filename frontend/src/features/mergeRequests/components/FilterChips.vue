<template>
  <div class="flex gap-1.5 flex-wrap mt-2.5">
    <button
      v-for="project in projects"
      :key="project"
      @click="$emit('toggle', project)"
      :class="isActive(project) ? 'border-accent bg-accent-soft text-text-primary' : 'border-border bg-surface text-text-muted'"
      class="font-mono text-[11.5px] px-2 py-1 rounded-md border cursor-pointer hover:border-text-faint"
    >
      {{ project }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  projects: { type: Array, required: true },
  activeProjects: { type: Set, default: null },
})

defineEmits(['toggle'])

function isActive(project) {
  return props.activeProjects ? props.activeProjects.has(project) : true
}
</script>

<template>
  <div class="flex gap-1.5 flex-wrap mt-2.5">
    <button
      v-for="project in projects"
      :key="project"
      @click="$emit('toggle', project)"
      :aria-pressed="isActive(project)"
      :class="isActive(project) ? 'border-accent bg-accent-soft text-text-primary' : 'border-border bg-surface text-text-muted'"
      class="font-mono text-[12px] px-2 py-1 rounded-md border cursor-pointer hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

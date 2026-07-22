<template>
  <component
    :is="linkUrl ? 'a' : 'span'"
    :href="linkUrl || undefined"
    :target="linkUrl ? '_blank' : undefined"
    :rel="linkUrl ? 'noopener' : undefined"
    :class="badgeClasses"
    :title="tooltip"
    class="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded no-underline"
  >
    <span v-html="icon"></span>
    <span>{{ label }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
  data: { type: Object, required: true },
})

const icon = computed(() => {
  if (props.type === 'pipeline') {
    const s = props.data.status
    if (s === 'success') return '&#10003;'
    if (s === 'failed' || s === 'canceled') return '&#10007;'
    if (s === 'running' || s === 'pending') return '&#9679;'
    return '&#8211;'
  }
  if (props.type === 'threads') {
    return props.data.unresolvedCount > 0 ? '&#9993;' : '&#10003;'
  }
  if (props.type === 'approvals') {
    return props.data.status === 'approved' ? '&#10003;' : '&#9998;'
  }
  if (props.type === 'conflicts') {
    return props.data.hasConflicts ? '&#10007;' : '&#10003;'
  }
  return ''
})

const label = computed(() => {
  if (props.type === 'pipeline') {
    const map = { success: 'CI OK', failed: 'CI Falló', running: 'CI...', pending: 'CI...', canceled: 'CI Cancel', none: 'Sin CI' }
    return map[props.data.status] || 'CI ?'
  }
  if (props.type === 'threads') {
    const c = props.data.unresolvedCount
    return c > 0 ? `${c} hilo${c > 1 ? 's' : ''}` : 'Hilos OK'
  }
  if (props.type === 'approvals') {
    if (props.data.status === 'unknown') return 'Approvals ?'
    return `${props.data.given}/${props.data.required}`
  }
  if (props.type === 'conflicts') {
    return props.data.hasConflicts ? 'Con conflictos' : 'Sin conflictos'
  }
  return ''
})

const tooltip = computed(() => {
  if (props.type === 'pipeline') return `Pipeline: ${props.data.status}`
  if (props.type === 'threads') return `${props.data.unresolvedCount} hilos sin resolver`
  if (props.type === 'approvals') {
    if (props.data.status === 'unknown') return 'No se pudo obtener info de approvals'
    const { given, required, approvers, hasLeadApproval } = props.data
    const parts = [`${given}/${required} aprobaciones`]
    if (approvers && approvers.length > 0) parts.push(`Aprobado por: ${approvers.join(', ')}`)
    if (!hasLeadApproval) parts.push('Falta aprobación del líder')
    return parts.join('\n')
  }
  if (props.type === 'conflicts') {
    return props.data.hasConflicts ? 'Tiene conflictos de merge' : 'Sin conflictos de merge'
  }
  return ''
})

const linkUrl = computed(() => {
  if (props.type === 'pipeline') return props.data.pipelineUrl || null
  return null
})

const badgeClasses = computed(() => {
  if (props.type === 'pipeline') {
    const s = props.data.status
    if (s === 'success') return 'bg-ready-soft text-ready'
    if (s === 'failed' || s === 'canceled') return 'bg-conflict-soft text-conflict'
    if (s === 'running' || s === 'pending') return 'bg-draft-soft text-draft'
    return 'bg-surface text-text-muted'
  }
  if (props.type === 'threads') {
    return props.data.unresolvedCount > 0
      ? 'bg-conflict-soft text-conflict'
      : 'bg-ready-soft text-ready'
  }
  if (props.type === 'approvals') {
    if (props.data.status === 'approved') return 'bg-ready-soft text-ready'
    if (props.data.status === 'pending') return 'bg-draft-soft text-draft'
    return 'bg-surface text-text-muted'
  }
  if (props.type === 'conflicts') {
    return props.data.hasConflicts
      ? 'bg-conflict-soft text-conflict'
      : 'bg-ready-soft text-ready'
  }
  return 'bg-surface text-text-muted'
})
</script>

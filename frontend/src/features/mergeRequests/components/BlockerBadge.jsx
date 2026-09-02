// Iconos como caracteres literales: en Vue se inyectaban con `v-html` como
// entidades HTML, acá no hace falta `dangerouslySetInnerHTML`.
function iconFor(type, data) {
  if (type === 'pipeline') {
    const status = data.status
    if (status === 'success') return '✓'
    if (status === 'failed' || status === 'canceled') return '✗'
    if (status === 'running' || status === 'pending') return '●'
    return '–'
  }
  if (type === 'threads') return data.unresolvedCount > 0 ? '✉' : '✓'
  if (type === 'approvals') return data.status === 'approved' ? '✓' : '✎'
  if (type === 'conflicts') return data.hasConflicts ? '✗' : '✓'
  return ''
}

function labelFor(type, data) {
  if (type === 'pipeline') {
    const map = { success: 'CI OK', failed: 'CI Falló', running: 'CI...', pending: 'CI...', canceled: 'CI Cancel', none: 'Sin CI' }
    return map[data.status] || 'CI ?'
  }
  if (type === 'threads') {
    const count = data.unresolvedCount
    return count > 0 ? `${count} hilo${count > 1 ? 's' : ''}` : 'Hilos OK'
  }
  if (type === 'approvals') {
    if (data.status === 'unknown') return 'Approvals ?'
    return `${data.given}/${data.required}`
  }
  if (type === 'conflicts') return data.hasConflicts ? 'Con conflictos' : 'Sin conflictos'
  return ''
}

function tooltipFor(type, data) {
  if (type === 'pipeline') return `Pipeline: ${data.status}`
  if (type === 'threads') return `${data.unresolvedCount} hilos sin resolver`
  if (type === 'approvals') {
    if (data.status === 'unknown') return 'No se pudo obtener info de approvals'
    const { given, required, approvers, hasLeadApproval } = data
    const parts = [`${given}/${required} aprobaciones`]
    if (approvers && approvers.length > 0) parts.push(`Aprobado por: ${approvers.join(', ')}`)
    if (!hasLeadApproval) parts.push('Falta aprobación del líder')
    return parts.join('\n')
  }
  if (type === 'conflicts') {
    return data.hasConflicts ? 'Tiene conflictos de merge' : 'Sin conflictos de merge'
  }
  return ''
}

function badgeClasses(type, data) {
  if (type === 'pipeline') {
    const status = data.status
    if (status === 'success') return 'bg-ready-soft text-ready'
    if (status === 'failed' || status === 'canceled') return 'bg-conflict-soft text-conflict'
    if (status === 'running' || status === 'pending') return 'bg-draft-soft text-draft'
    return 'bg-surface text-text-muted'
  }
  if (type === 'threads') {
    return data.unresolvedCount > 0 ? 'bg-conflict-soft text-conflict' : 'bg-ready-soft text-ready'
  }
  if (type === 'approvals') {
    if (data.status === 'approved') return 'bg-ready-soft text-ready'
    if (data.status === 'pending') return 'bg-draft-soft text-draft'
    return 'bg-surface text-text-muted'
  }
  if (type === 'conflicts') {
    return data.hasConflicts ? 'bg-conflict-soft text-conflict' : 'bg-ready-soft text-ready'
  }
  return 'bg-surface text-text-muted'
}

function BlockerBadge({ type, data }) {
  const linkUrl = type === 'pipeline' ? data.pipelineUrl || null : null
  const tooltip = tooltipFor(type, data)
  // Sólo el badge de pipeline enlaza; el resto es texto, así que el elemento
  // cambia entre `a` y `span` según haya URL.
  const Tag = linkUrl ? 'a' : 'span'

  return (
    <Tag
      href={linkUrl || undefined}
      target={linkUrl ? '_blank' : undefined}
      rel={linkUrl ? 'noopener' : undefined}
      title={tooltip}
      aria-label={`${tooltip}${linkUrl ? '. Abre en una pestaña nueva.' : ''}`}
      className={`${badgeClasses(type, data)} inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <span aria-hidden="true">{iconFor(type, data)}</span>
      <span>{labelFor(type, data)}</span>
      {linkUrl ? <span className="sr-only">(abre en una pestaña nueva)</span> : null}
    </Tag>
  )
}

export default BlockerBadge

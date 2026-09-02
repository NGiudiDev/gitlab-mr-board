import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import BlockerBadge from './BlockerBadge.jsx'

/** El badge es el elemento raíz del componente. */
function renderBadge(type, data) {
  const { container } = render(<BlockerBadge type={type} data={data} />)
  return container.firstChild
}

describe('BlockerBadge de pipeline', () => {
  it.each([
    ['success', 'CI OK'],
    ['failed', 'CI Falló'],
    ['running', 'CI...'],
    ['pending', 'CI...'],
    ['canceled', 'CI Cancel'],
    ['none', 'Sin CI'],
    ['skipped', 'CI ?'],
  ])('muestra el estado %s como %s', (status, label) => {
    const badge = renderBadge('pipeline', { status, pipelineUrl: null })

    expect(badge.textContent).toContain(label)
  })

  it('describe el estado en el nombre accesible', () => {
    const badge = renderBadge('pipeline', { status: 'failed', pipelineUrl: null })

    expect(badge.getAttribute('aria-label')).toBe('Pipeline: failed')
  })

  it('enlaza al pipeline cuando GitLab devuelve la URL', () => {
    const badge = renderBadge('pipeline', { status: 'success', pipelineUrl: 'https://gitlab.example.com/pipe/1' })

    expect(badge.tagName).toBe('A')
    expect(badge.getAttribute('href')).toBe('https://gitlab.example.com/pipe/1')
    expect(badge.getAttribute('target')).toBe('_blank')
    expect(badge.getAttribute('rel')).toBe('noopener')
    expect(badge.getAttribute('aria-label')).toContain('Abre en una pestaña nueva')
    expect(badge.textContent).toContain('abre en una pestaña nueva')
  })

  it('no enlaza cuando no hay URL de pipeline', () => {
    const badge = renderBadge('pipeline', { status: 'none', pipelineUrl: null })

    expect(badge.tagName).toBe('SPAN')
    expect(badge.getAttribute('href')).toBeNull()
  })
})

describe('BlockerBadge de hilos', () => {
  it('muestra el plural con más de un hilo sin resolver', () => {
    const badge = renderBadge('threads', { status: 'open', unresolvedCount: 3 })

    expect(badge.textContent).toContain('3 hilos')
    expect(badge.getAttribute('aria-label')).toBe('3 hilos sin resolver')
  })

  it('muestra el singular con un solo hilo sin resolver', () => {
    const badge = renderBadge('threads', { status: 'open', unresolvedCount: 1 })

    expect(badge.textContent).toContain('1 hilo')
    expect(badge.textContent).not.toContain('1 hilos')
  })

  it('avisa que no quedan hilos pendientes', () => {
    const badge = renderBadge('threads', { status: 'resolved', unresolvedCount: 0 })

    expect(badge.textContent).toContain('Hilos OK')
  })
})

describe('BlockerBadge de aprobaciones', () => {
  it('muestra las aprobaciones obtenidas sobre las requeridas', () => {
    const badge = renderBadge('approvals', {
      status: 'pending', given: 1, required: 2, approvers: ['ana'], hasLeadApproval: false,
    })

    expect(badge.textContent).toContain('1/2')
  })

  it('detalla los aprobadores y la falta del líder en el nombre accesible', () => {
    const badge = renderBadge('approvals', {
      status: 'pending', given: 1, required: 2, approvers: ['ana'], hasLeadApproval: false,
    })

    const label = badge.getAttribute('aria-label')
    expect(label).toContain('1/2 aprobaciones')
    expect(label).toContain('Aprobado por: ana')
    expect(label).toContain('Falta aprobación del líder')
  })

  it('no menciona al líder cuando su aprobación está', () => {
    const badge = renderBadge('approvals', {
      status: 'approved', given: 2, required: 2, approvers: ['ana', 'lider'], hasLeadApproval: true,
    })

    expect(badge.getAttribute('aria-label')).not.toContain('Falta aprobación del líder')
  })

  it('avisa cuando no pudo obtener la información', () => {
    const badge = renderBadge('approvals', { status: 'unknown', given: 0, required: 0 })

    expect(badge.textContent).toContain('Approvals ?')
    expect(badge.getAttribute('aria-label')).toBe('No se pudo obtener info de approvals')
  })
})

describe('BlockerBadge de conflictos', () => {
  it('informa los conflictos con texto, no sólo con color', () => {
    const badge = renderBadge('conflicts', { hasConflicts: true })

    expect(badge.textContent).toContain('Con conflictos')
    expect(badge.getAttribute('aria-label')).toBe('Tiene conflictos de merge')
  })

  it('informa la ausencia de conflictos', () => {
    const badge = renderBadge('conflicts', { hasConflicts: false })

    expect(badge.textContent).toContain('Sin conflictos')
    expect(badge.getAttribute('aria-label')).toBe('Sin conflictos de merge')
  })
})

describe('accesibilidad común de BlockerBadge', () => {
  it('oculta el icono decorativo a las tecnologías de asistencia', () => {
    const badge = renderBadge('conflicts', { hasConflicts: true })

    expect(badge.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BlockerBadge from './BlockerBadge.vue'

function mountBadge(type, data) {
  return mount(BlockerBadge, { props: { type, data } })
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
    const wrapper = mountBadge('pipeline', { status, pipelineUrl: null })

    expect(wrapper.text()).toContain(label)
  })

  it('describe el estado en el nombre accesible', () => {
    const wrapper = mountBadge('pipeline', { status: 'failed', pipelineUrl: null })

    expect(wrapper.attributes('aria-label')).toBe('Pipeline: failed')
  })

  it('enlaza al pipeline cuando GitLab devuelve la URL', () => {
    const wrapper = mountBadge('pipeline', { status: 'success', pipelineUrl: 'https://gitlab.example.com/pipe/1' })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('https://gitlab.example.com/pipe/1')
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener')
    expect(wrapper.attributes('aria-label')).toContain('Abre en una pestaña nueva')
    expect(wrapper.text()).toContain('abre en una pestaña nueva')
  })

  it('no enlaza cuando no hay URL de pipeline', () => {
    const wrapper = mountBadge('pipeline', { status: 'none', pipelineUrl: null })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.attributes('href')).toBeUndefined()
  })
})

describe('BlockerBadge de hilos', () => {
  it('muestra el plural con más de un hilo sin resolver', () => {
    const wrapper = mountBadge('threads', { status: 'open', unresolvedCount: 3 })

    expect(wrapper.text()).toContain('3 hilos')
    expect(wrapper.attributes('aria-label')).toBe('3 hilos sin resolver')
  })

  it('muestra el singular con un solo hilo sin resolver', () => {
    const wrapper = mountBadge('threads', { status: 'open', unresolvedCount: 1 })

    expect(wrapper.text()).toContain('1 hilo')
    expect(wrapper.text()).not.toContain('1 hilos')
  })

  it('avisa que no quedan hilos pendientes', () => {
    const wrapper = mountBadge('threads', { status: 'resolved', unresolvedCount: 0 })

    expect(wrapper.text()).toContain('Hilos OK')
  })
})

describe('BlockerBadge de aprobaciones', () => {
  it('muestra las aprobaciones obtenidas sobre las requeridas', () => {
    const wrapper = mountBadge('approvals', {
      status: 'pending', given: 1, required: 2, approvers: ['ana'], hasLeadApproval: false,
    })

    expect(wrapper.text()).toContain('1/2')
  })

  it('detalla los aprobadores y la falta del líder en el nombre accesible', () => {
    const wrapper = mountBadge('approvals', {
      status: 'pending', given: 1, required: 2, approvers: ['ana'], hasLeadApproval: false,
    })

    const label = wrapper.attributes('aria-label')
    expect(label).toContain('1/2 aprobaciones')
    expect(label).toContain('Aprobado por: ana')
    expect(label).toContain('Falta aprobación del líder')
  })

  it('no menciona al líder cuando su aprobación está', () => {
    const wrapper = mountBadge('approvals', {
      status: 'approved', given: 2, required: 2, approvers: ['ana', 'lider'], hasLeadApproval: true,
    })

    expect(wrapper.attributes('aria-label')).not.toContain('Falta aprobación del líder')
  })

  it('avisa cuando no pudo obtener la información', () => {
    const wrapper = mountBadge('approvals', { status: 'unknown', given: 0, required: 0 })

    expect(wrapper.text()).toContain('Approvals ?')
    expect(wrapper.attributes('aria-label')).toBe('No se pudo obtener info de approvals')
  })
})

describe('BlockerBadge de conflictos', () => {
  it('informa los conflictos con texto, no sólo con color', () => {
    const wrapper = mountBadge('conflicts', { hasConflicts: true })

    expect(wrapper.text()).toContain('Con conflictos')
    expect(wrapper.attributes('aria-label')).toBe('Tiene conflictos de merge')
  })

  it('informa la ausencia de conflictos', () => {
    const wrapper = mountBadge('conflicts', { hasConflicts: false })

    expect(wrapper.text()).toContain('Sin conflictos')
    expect(wrapper.attributes('aria-label')).toBe('Sin conflictos de merge')
  })
})

describe('accesibilidad común de BlockerBadge', () => {
  it('oculta el icono decorativo a las tecnologías de asistencia', () => {
    const wrapper = mountBadge('conflicts', { hasConflicts: true })

    expect(wrapper.get('[aria-hidden="true"]').exists()).toBe(true)
  })
})

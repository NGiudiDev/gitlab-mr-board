import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { buildMergeRequest } from '../../../../test/fixtures/mergeRequests.js'
import MrCard from './MrCard.vue'

function mountCard(overrides = {}) {
  return mount(MrCard, { props: { mr: buildMergeRequest(overrides) } })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MrCard', () => {
  it('enlaza el título al MR de GitLab en una pestaña nueva', () => {
    const wrapper = mountCard({ title: 'Agregar filtro por autor' })
    const link = wrapper.get('a')

    expect(link.text()).toContain('Agregar filtro por autor')
    expect(link.attributes('href')).toBe('https://gitlab.example.com/equipo/tablero/-/merge_requests/1')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener')
    expect(link.text()).toContain('abre en una pestaña nueva')
  })

  it('muestra la rama de origen y la de destino', () => {
    const wrapper = mountCard({ sourceBranch: 'fix/approvals', targetBranch: 'develop' })

    expect(wrapper.text()).toContain('fix/approvals')
    expect(wrapper.text()).toContain('develop')
  })

  it('muestra el autor', () => {
    const wrapper = mountCard({ author: 'Ana Pérez' })

    expect(wrapper.text()).toContain('Ana Pérez')
  })

  it('renderiza los cuatro indicadores de bloqueo', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('CI OK')
    expect(wrapper.text()).toContain('Hilos OK')
    expect(wrapper.text()).toContain('2/2')
    expect(wrapper.text()).toContain('Sin conflictos')
  })

  it.each(['gray', 'yellow', 'green', 'qa'])('muestra al autor como responsable en %s', (mergeability) => {
    const wrapper = mountCard({ mergeability, author: 'Ana Pérez' })

    expect(wrapper.text()).toContain('Responsable:')
    expect(wrapper.text()).toContain('Ana Pérez')
  })

  // El código actual no asigna responsable en backlog, a diferencia de lo que
  // dice docs/domains/merge-requests.md. La prueba fija el comportamiento real.
  it('no muestra responsable en backlog', () => {
    const wrapper = mountCard({ mergeability: 'backlog' })

    expect(wrapper.text()).not.toContain('Responsable:')
  })

  it('muestra a los reviewers como responsables en code review', () => {
    const wrapper = mountCard({
      mergeability: 'review',
      reviewers: [
        { name: 'Beto Ruiz', username: 'beto', avatar: null },
        { name: 'Caro Díaz', username: 'caro', avatar: null },
      ],
    })

    expect(wrapper.text()).toContain('Responsable:')
    expect(wrapper.text()).toContain('Beto Ruiz, Caro Díaz')
  })

  it('no muestra responsable en code review sin reviewers asignados', () => {
    const wrapper = mountCard({ mergeability: 'review', reviewers: [] })

    expect(wrapper.text()).not.toContain('Responsable:')
  })

  it.each([
    ['2026-08-28T11:30:00.000Z', '30m'],
    ['2026-08-28T09:00:00.000Z', '3h'],
    ['2026-08-25T12:00:00.000Z', '3d'],
  ])('muestra la antigüedad de %s como %s', (updatedAt, expected) => {
    const wrapper = mountCard({ updatedAt })

    expect(wrapper.text()).toContain(expected)
  })

  it('muestra al menos un minuto para una actualización reciente', () => {
    const wrapper = mountCard({ updatedAt: '2026-08-28T11:59:59.000Z' })

    expect(wrapper.text()).toContain('1m')
  })
})

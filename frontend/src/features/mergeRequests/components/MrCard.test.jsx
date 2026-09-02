import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { buildMergeRequest } from '../../../../test/fixtures/mergeRequests.js'
import MrCard from './MrCard.jsx'

function renderCard(overrides = {}) {
  return render(<MrCard mr={buildMergeRequest(overrides)} />)
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
    const { container } = renderCard({ title: 'Agregar filtro por autor' })
    const link = container.querySelector('a')

    expect(link.textContent).toContain('Agregar filtro por autor')
    expect(link.getAttribute('href')).toBe('https://gitlab.example.com/equipo/tablero/-/merge_requests/1')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener')
    expect(link.textContent).toContain('abre en una pestaña nueva')
  })

  it('muestra la rama de origen y la de destino', () => {
    const { container } = renderCard({ sourceBranch: 'fix/approvals', targetBranch: 'develop' })

    expect(container.textContent).toContain('fix/approvals')
    expect(container.textContent).toContain('develop')
  })

  it('muestra el autor', () => {
    const { container } = renderCard({ author: 'Ana Pérez' })

    expect(container.textContent).toContain('Ana Pérez')
  })

  it('renderiza los cuatro indicadores de bloqueo', () => {
    const { container } = renderCard()

    expect(container.textContent).toContain('CI OK')
    expect(container.textContent).toContain('Hilos OK')
    expect(container.textContent).toContain('2/2')
    expect(container.textContent).toContain('Sin conflictos')
  })

  it.each(['in_progress', 'mr_warning', 'ready_to_merge', 'qa'])('muestra al autor como responsable en %s', (mergeability) => {
    const { container } = renderCard({ mergeability, author: 'Ana Pérez' })

    expect(container.textContent).toContain('Responsable:')
    expect(container.textContent).toContain('Ana Pérez')
  })

  // El código actual no asigna responsable en backlog, a diferencia de lo que
  // dice docs/domains/merge-requests.md. La prueba fija el comportamiento real.
  it('no muestra responsable en backlog', () => {
    const { container } = renderCard({ mergeability: 'backlog' })

    expect(container.textContent).not.toContain('Responsable:')
  })

  it('muestra a los reviewers como responsables en code review', () => {
    const { container } = renderCard({
      mergeability: 'review',
      reviewers: [
        { name: 'Beto Ruiz', username: 'beto', avatar: null },
        { name: 'Caro Díaz', username: 'caro', avatar: null },
      ],
    })

    expect(container.textContent).toContain('Responsable:')
    expect(container.textContent).toContain('Beto Ruiz, Caro Díaz')
  })

  it('no muestra responsable en code review sin reviewers asignados', () => {
    const { container } = renderCard({ mergeability: 'review', reviewers: [] })

    expect(container.textContent).not.toContain('Responsable:')
  })

  it.each([
    ['2026-08-28T11:30:00.000Z', '30m'],
    ['2026-08-28T09:00:00.000Z', '3h'],
    ['2026-08-25T12:00:00.000Z', '3d'],
  ])('muestra la antigüedad de %s como %s', (updatedAt, expected) => {
    const { container } = renderCard({ updatedAt })

    expect(container.textContent).toContain(expected)
  })

  it('muestra al menos un minuto para una actualización reciente', () => {
    const { container } = renderCard({ updatedAt: '2026-08-28T11:59:59.000Z' })

    expect(container.textContent).toContain('1m')
  })

  it('expone la tarjeta como artículo', () => {
    renderCard({ title: 'Agregar filtro por autor' })

    expect(screen.getByRole('article')).not.toBeNull()
  })
})

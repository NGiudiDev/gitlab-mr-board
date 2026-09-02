import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterChips from './FilterChips.jsx'

const PROJECTS = ['equipo/tablero', 'equipo/api']

function renderChips(props = {}) {
  return render(<FilterChips projects={PROJECTS} onToggle={() => {}} {...props} />)
}

describe('FilterChips', () => {
  it('renderiza un control por proyecto', () => {
    renderChips()

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(PROJECTS)
  })

  it('marca todos los proyectos como activos sin filtro explícito', () => {
    renderChips()

    expect(screen.getAllByRole('button').every((button) => button.getAttribute('aria-pressed') === 'true'))
      .toBe(true)
  })

  it('refleja en aria-pressed qué proyectos están activos', () => {
    renderChips({ activeProjects: new Set(['equipo/api']) })
    const [tablero, api] = screen.getAllByRole('button')

    expect(tablero.getAttribute('aria-pressed')).toBe('false')
    expect(api.getAttribute('aria-pressed')).toBe('true')
  })

  it('informa al padre el proyecto elegido', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderChips({ onToggle })

    await user.click(screen.getAllByRole('button')[1])

    expect(onToggle).toHaveBeenCalledWith('equipo/api')
  })

  it('no renderiza controles sin proyectos', () => {
    renderChips({ projects: [] })

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

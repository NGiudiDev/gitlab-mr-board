import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildMergeRequest } from '../../../../test/fixtures/mergeRequests.js'
import MrBoard from './MrBoard.jsx'

const COLUMN_NAMES = ['En progreso', 'Pendientes', 'Code Review', 'QA', 'Listas para mergear', 'Pausados']

function renderBoard(props = {}) {
  return render(<MrBoard mergeRequests={[]} allProjects={[]} {...props} />)
}

/** Secciones de proyecto (las columnas también usan <section>). */
function projectSections(container) {
  return [...container.querySelectorAll('section[aria-labelledby^="proyecto-"]')]
}

/**
 * Columnas del primer proyecto con la cantidad de tarjetas que muestran.
 * Se lee del DOM en vez de las props del hijo: es lo que ve la persona usuaria.
 */
function columnsOfFirstProject(container) {
  return [...projectSections(container)[0].querySelectorAll('section[aria-labelledby^="columna-"]')]
    .map((column) => ({
      title: column.querySelector('h3').textContent,
      total: column.querySelectorAll('article').length,
    }))
}

describe('agrupación por proyecto', () => {
  it('crea una sección por proyecto informado por el backend', () => {
    const { container } = renderBoard({ allProjects: ['equipo/tablero', 'equipo/api'] })

    expect(projectSections(container)).toHaveLength(2)
    expect(container.textContent).toContain('equipo/tablero')
    expect(container.textContent).toContain('equipo/api')
  })

  it('ordena los proyectos alfabéticamente', () => {
    renderBoard({ allProjects: ['equipo/tablero', 'equipo/api'] })

    const nombres = screen.getAllByRole('button').map((button) => button.textContent)
    expect(nombres[0]).toContain('equipo/api')
    expect(nombres[1]).toContain('equipo/tablero')
  })

  it('agrega los proyectos que sólo aparecen en los merge requests', () => {
    const { container } = renderBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [buildMergeRequest({ id: '303-1', projectPath: 'otro/proyecto' })],
    })

    expect(projectSections(container)).toHaveLength(2)
    expect(container.textContent).toContain('otro/proyecto')
  })

  it('muestra la cantidad de merge requests de cada proyecto', () => {
    renderBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1' }),
        buildMergeRequest({ id: '101-2' }),
      ],
    })

    const button = screen.getByRole('button')
    expect(button.textContent).toContain('2')
    expect(button.textContent).toContain('merge requests')
  })
})

describe('columnas por estado', () => {
  it('muestra las seis columnas en el orden documentado', async () => {
    const user = userEvent.setup()
    const { container } = renderBoard({ allProjects: ['equipo/tablero'] })
    await user.click(screen.getByRole('button'))

    expect(columnsOfFirstProject(container).map((column) => column.title)).toEqual(COLUMN_NAMES)
  })

  it('ubica cada merge request en la columna de su clasificación', async () => {
    const user = userEvent.setup()
    const { container } = renderBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1', mergeability: 'in_progress' }),
        buildMergeRequest({ id: '101-2', mergeability: 'mr_warning' }),
        buildMergeRequest({ id: '101-3', mergeability: 'review' }),
        buildMergeRequest({ id: '101-4', mergeability: 'qa' }),
        buildMergeRequest({ id: '101-5', mergeability: 'ready_to_merge' }),
        buildMergeRequest({ id: '101-6', mergeability: 'backlog' }),
      ],
    })
    await user.click(screen.getByRole('button'))

    expect(columnsOfFirstProject(container)).toEqual(
      COLUMN_NAMES.map((title) => ({ title, total: 1 })),
    )
  })

  it('acumula en una misma columna los merge requests con igual clasificación', async () => {
    const user = userEvent.setup()
    const { container } = renderBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1', mergeability: 'review' }),
        buildMergeRequest({ id: '101-2', mergeability: 'review' }),
      ],
    })
    await user.click(screen.getByRole('button'))

    const review = columnsOfFirstProject(container).find((column) => column.title === 'Code Review')
    expect(review.total).toBe(2)
  })

  it('no mezcla merge requests entre proyectos', async () => {
    const user = userEvent.setup()
    const { container } = renderBoard({
      allProjects: ['equipo/api', 'equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1', title: 'De tablero', projectPath: 'equipo/tablero', mergeability: 'ready_to_merge' }),
        buildMergeRequest({ id: '202-1', title: 'De api', projectPath: 'equipo/api', mergeability: 'review' }),
      ],
    })
    const [apiButton, tableroButton] = screen.getAllByRole('button')
    await user.click(apiButton)
    await user.click(tableroButton)

    const apiSection = projectSections(container)[0]
    const apiReview = [...apiSection.querySelectorAll('section[aria-labelledby^="columna-"]')]
      .find((column) => column.querySelector('h3').textContent === 'Code Review')

    expect(apiReview.textContent).toContain('De api')
    expect(apiReview.textContent).not.toContain('De tablero')
  })
})

describe('expansión de proyectos', () => {
  it('arranca contraído', () => {
    renderBoard({ allProjects: ['equipo/tablero'] })

    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  })

  it('expande y contrae al activar el encabezado', async () => {
    const user = userEvent.setup()
    renderBoard({ allProjects: ['equipo/tablero'] })
    const button = screen.getByRole('button')

    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('vincula el botón con el panel que controla', () => {
    const { container } = renderBoard({ allProjects: ['equipo/tablero'] })
    const panelId = screen.getByRole('button').getAttribute('aria-controls')

    expect(container.querySelector(`#${panelId}`)).not.toBeNull()
  })

  it('expande cada proyecto de forma independiente', async () => {
    const user = userEvent.setup()
    renderBoard({ allProjects: ['equipo/api', 'equipo/tablero'] })
    const [apiButton, tableroButton] = screen.getAllByRole('button')

    await user.click(apiButton)

    expect(apiButton.getAttribute('aria-expanded')).toBe('true')
    expect(tableroButton.getAttribute('aria-expanded')).toBe('false')
  })

  it('nombra cada sección con la ruta del proyecto', () => {
    const { container } = renderBoard({ allProjects: ['equipo/tablero'] })
    const headingId = projectSections(container)[0].getAttribute('aria-labelledby')

    expect(container.querySelector(`#${headingId}`).textContent).toBe('equipo/tablero')
  })
})

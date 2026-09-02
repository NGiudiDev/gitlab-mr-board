import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { buildMergeRequest } from '../../../../test/fixtures/mergeRequests.js'
import BoardColumn from './BoardColumn.vue'
import MrBoard from './MrBoard.vue'

const COLUMN_NAMES = ['Draft', 'Pendientes', 'Code Review', 'QA', 'Listas para mergear', 'Despriorizado']

function mountBoard(props = {}) {
  return mount(MrBoard, {
    props: { mergeRequests: [], allProjects: [], ...props },
  })
}

/** Secciones de proyecto (las columnas también usan <section>). */
function projectSections(wrapper) {
  return wrapper.findAll('section[aria-labelledby^="proyecto-"]')
}

/** Devuelve las columnas del primer proyecto con su cantidad de tarjetas. */
function columnsOfFirstProject(wrapper) {
  return wrapper.findAllComponents(BoardColumn).map((column) => ({
    title: column.props('title'),
    total: column.props('mergeRequests').length,
  }))
}

describe('agrupación por proyecto', () => {
  it('crea una sección por proyecto informado por el backend', () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero', 'equipo/api'] })

    expect(projectSections(wrapper)).toHaveLength(2)
    expect(wrapper.text()).toContain('equipo/tablero')
    expect(wrapper.text()).toContain('equipo/api')
  })

  it('ordena los proyectos alfabéticamente', () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero', 'equipo/api'] })

    const nombres = wrapper.findAll('button').map((button) => button.text())
    expect(nombres[0]).toContain('equipo/api')
    expect(nombres[1]).toContain('equipo/tablero')
  })

  it('agrega los proyectos que sólo aparecen en los merge requests', () => {
    const wrapper = mountBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [buildMergeRequest({ id: '303-1', projectPath: 'otro/proyecto' })],
    })

    expect(projectSections(wrapper)).toHaveLength(2)
    expect(wrapper.text()).toContain('otro/proyecto')
  })

  it('muestra la cantidad de merge requests de cada proyecto', () => {
    const wrapper = mountBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1' }),
        buildMergeRequest({ id: '101-2' }),
      ],
    })

    const button = wrapper.get('button')
    expect(button.text()).toContain('2')
    expect(button.text()).toContain('merge requests')
  })
})

describe('columnas por estado', () => {
  it('muestra las seis columnas en el orden documentado', async () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero'] })
    await wrapper.get('button').trigger('click')

    expect(columnsOfFirstProject(wrapper).map((column) => column.title)).toEqual(COLUMN_NAMES)
  })

  it('ubica cada merge request en la columna de su clasificación', async () => {
    const wrapper = mountBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1', mergeability: 'gray' }),
        buildMergeRequest({ id: '101-2', mergeability: 'yellow' }),
        buildMergeRequest({ id: '101-3', mergeability: 'review' }),
        buildMergeRequest({ id: '101-4', mergeability: 'qa' }),
        buildMergeRequest({ id: '101-5', mergeability: 'green' }),
        buildMergeRequest({ id: '101-6', mergeability: 'backlog' }),
      ],
    })
    await wrapper.get('button').trigger('click')

    expect(columnsOfFirstProject(wrapper)).toEqual(
      COLUMN_NAMES.map((title) => ({ title, total: 1 })),
    )
  })

  it('acumula en una misma columna los merge requests con igual clasificación', async () => {
    const wrapper = mountBoard({
      allProjects: ['equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1', mergeability: 'review' }),
        buildMergeRequest({ id: '101-2', mergeability: 'review' }),
      ],
    })
    await wrapper.get('button').trigger('click')

    const review = columnsOfFirstProject(wrapper).find((column) => column.title === 'Code Review')
    expect(review.total).toBe(2)
  })

  it('no mezcla merge requests entre proyectos', async () => {
    const wrapper = mountBoard({
      allProjects: ['equipo/api', 'equipo/tablero'],
      mergeRequests: [
        buildMergeRequest({ id: '101-1', projectPath: 'equipo/tablero', mergeability: 'green' }),
        buildMergeRequest({ id: '202-1', projectPath: 'equipo/api', mergeability: 'review' }),
      ],
    })
    const [apiButton, tableroButton] = wrapper.findAll('button')
    await apiButton.trigger('click')
    await tableroButton.trigger('click')

    const columns = wrapper.findAllComponents(BoardColumn)
    const apiReview = columns.find((column) => column.props('title') === 'Code Review')
    expect(apiReview.props('mergeRequests').map((mr) => mr.id)).toEqual(['202-1'])
  })
})

describe('expansión de proyectos', () => {
  it('arranca contraído', () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero'] })

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
  })

  it('expande y contrae al activar el encabezado', async () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero'] })
    const button = wrapper.get('button')

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('vincula el botón con el panel que controla', () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero'] })
    const panelId = wrapper.get('button').attributes('aria-controls')

    expect(wrapper.get(`#${panelId}`).exists()).toBe(true)
  })

  it('expande cada proyecto de forma independiente', async () => {
    const wrapper = mountBoard({ allProjects: ['equipo/api', 'equipo/tablero'] })
    const [apiButton, tableroButton] = wrapper.findAll('button')

    await apiButton.trigger('click')

    expect(apiButton.attributes('aria-expanded')).toBe('true')
    expect(tableroButton.attributes('aria-expanded')).toBe('false')
  })

  it('nombra cada sección con la ruta del proyecto', () => {
    const wrapper = mountBoard({ allProjects: ['equipo/tablero'] })
    const headingId = projectSections(wrapper)[0].attributes('aria-labelledby')

    expect(wrapper.get(`#${headingId}`).text()).toBe('equipo/tablero')
  })
})

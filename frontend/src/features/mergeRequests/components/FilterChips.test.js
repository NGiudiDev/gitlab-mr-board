import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from './FilterChips.vue'

const PROJECTS = ['equipo/tablero', 'equipo/api']

function mountChips(props = {}) {
  return mount(FilterChips, { props: { projects: PROJECTS, ...props } })
}

describe('FilterChips', () => {
  it('renderiza un control por proyecto', () => {
    const wrapper = mountChips()

    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(PROJECTS)
  })

  it('marca todos los proyectos como activos sin filtro explícito', () => {
    const wrapper = mountChips()

    expect(wrapper.findAll('button').every((button) => button.attributes('aria-pressed') === 'true'))
      .toBe(true)
  })

  it('refleja en aria-pressed qué proyectos están activos', () => {
    const wrapper = mountChips({ activeProjects: new Set(['equipo/api']) })
    const [tablero, api] = wrapper.findAll('button')

    expect(tablero.attributes('aria-pressed')).toBe('false')
    expect(api.attributes('aria-pressed')).toBe('true')
  })

  it('emite toggle con el proyecto elegido', async () => {
    const wrapper = mountChips()

    await wrapper.findAll('button')[1].trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([['equipo/api']])
  })

  it('no renderiza controles sin proyectos', () => {
    const wrapper = mountChips({ projects: [] })

    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})

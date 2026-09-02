import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TopBar from './TopBar.vue'

function mountTopBar(props = {}) {
  return mount(TopBar, { props })
}

describe('TopBar', () => {
  it('muestra el título del tablero como encabezado principal', () => {
    const wrapper = mountTopBar()

    expect(wrapper.get('h1').text()).toBe('Tablero de MRs')
  })

  it('resume los proyectos y merge requests cuando hay metadatos', () => {
    const wrapper = mountTopBar({ meta: { projectCount: 2, totalMRs: 5 } })

    expect(wrapper.text()).toContain('2 proyectos')
    expect(wrapper.text()).toContain('5 MRs abiertas')
  })

  it('indica que está cargando mientras no hay metadatos', () => {
    const wrapper = mountTopBar()

    expect(wrapper.text()).toContain('Cargando...')
  })

  it('anuncia el estado de actualización en una región de estado', () => {
    const wrapper = mountTopBar({ loading: true })

    expect(wrapper.get('[role="status"]').text()).toContain('Actualizando...')
  })

  it('anuncia el error con texto y no sólo con color', () => {
    const wrapper = mountTopBar({ error: 'No se pudo conectar al backend.' })

    expect(wrapper.get('[role="status"]').text()).toContain('Error')
  })

  it('muestra la hora de la última actualización', () => {
    const wrapper = mountTopBar({ lastFetched: new Date('2026-08-28T15:30:00.000Z') })

    expect(wrapper.get('[role="status"]').text()).toMatch(/\d{2}:\d{2}/)
  })

  it('informa que no hay datos todavía', () => {
    const wrapper = mountTopBar()

    expect(wrapper.get('[role="status"]').text()).toContain('Sin datos')
  })

  it('emite refresh al usar el botón de actualización manual', async () => {
    const wrapper = mountTopBar()

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('deshabilita el botón mientras carga', () => {
    const wrapper = mountTopBar({ loading: true })

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })

  it('no emite refresh con el botón deshabilitado', async () => {
    const wrapper = mountTopBar({ loading: true })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('refresh')).toBeUndefined()
  })

  it('oculta el indicador decorativo a las tecnologías de asistencia', () => {
    const wrapper = mountTopBar({ loading: true })

    expect(wrapper.get('[role="status"] [aria-hidden="true"]').exists()).toBe(true)
  })
})

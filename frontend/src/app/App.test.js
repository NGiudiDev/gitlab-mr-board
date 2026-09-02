import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { buildMergeRequest, buildResponse } from '../../test/fixtures/mergeRequests.js'
import { jsonResponse, resetSharedState } from '../../test/sharedState.js'
import App from './App.vue'

const MRS = [
  buildMergeRequest({
    id: '101-1', title: 'Agregar filtro por autor', author: 'Ana Pérez',
    projectPath: 'equipo/tablero', mergeability: 'ready_to_merge',
  }),
  buildMergeRequest({
    id: '202-1', title: 'Corregir cálculo de approvals', author: 'Beto Ruiz',
    projectPath: 'equipo/api', mergeability: 'review',
  }),
]

let fetchMock
let wrapper

/** Región de estado del tablero; TopBar expone otro role="status". */
function boardStatus(wrapper) {
  return wrapper.get('section[aria-labelledby="tablero-heading"] [role="status"]')
}

/** Monta la app y espera a que termine la carga inicial. */
async function mountApp() {
  wrapper = mount(App)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'))
  fetchMock = vi.fn(async () => jsonResponse(buildResponse(MRS)))
  vi.stubGlobal('fetch', fetchMock)
  resetSharedState()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('carga inicial', () => {
  it('consulta el backend al abrir el tablero', async () => {
    await mountApp()

    expect(fetchMock).toHaveBeenCalledWith('/api/pull-requests')
  })

  it('muestra el tablero con los proyectos recibidos', async () => {
    await mountApp()

    expect(wrapper.text()).toContain('equipo/tablero')
    expect(wrapper.text()).toContain('equipo/api')
    expect(wrapper.text()).toContain('2 MRs en total')
  })

  it('anuncia la carga sin mover el foco', async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {}))
    wrapper = mount(App)
    await flushPromises()

    const cargando = boardStatus(wrapper)
    expect(cargando.text()).toContain('Cargando merge requests')
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('Actualizando merge requests.')
  })

  it('anuncia el resultado cuando termina de cargar', async () => {
    await mountApp()

    expect(wrapper.get('[aria-live="polite"]').text())
      .toBe('Actualización completa. Se muestran 2 de 2 merge requests.')
  })

  it('ofrece un enlace para saltar al contenido principal', async () => {
    await mountApp()

    expect(wrapper.get('a[href="#contenido-principal"]').text()).toContain('Saltar al contenido principal')
    expect(wrapper.get('main').attributes('id')).toBe('contenido-principal')
  })

  it('usa un único main con encabezado accesible del tablero', async () => {
    await mountApp()

    expect(wrapper.findAll('main')).toHaveLength(1)
    expect(wrapper.get('#tablero-heading').text()).toBe('Merge requests por proyecto y estado')
  })
})

describe('estado de error', () => {
  it('avisa que no pudo conectar y muestra el detalle', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Token inválido.' }, 502))
    await mountApp()

    const alerta = wrapper.get('[role="alert"]')
    expect(alerta.text()).toContain('No se pudo conectar al backend.')
    expect(alerta.text()).toContain('Token inválido.')
  })

  it('anuncia el error en la región de estado', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    await mountApp()

    expect(wrapper.get('[aria-live="polite"]').text()).toContain('No se pudieron actualizar los datos')
  })

  it('mantiene el tablero visible si ya había datos', async () => {
    await mountApp()

    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('equipo/tablero')
  })
})

describe('estado vacío', () => {
  it('avisa cuando el backend no devuelve merge requests', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(buildResponse([])))
    await mountApp()

    expect(boardStatus(wrapper).text()).toContain('Ninguna MR coincide con los filtros actuales.')
  })

  it('avisa cuando la búsqueda no encuentra coincidencias', async () => {
    await mountApp()

    await wrapper.get('input[type="search"]').setValue('no-existe')

    expect(boardStatus(wrapper).text()).toContain('Ninguna MR coincide con los filtros actuales.')
  })
})

describe('búsqueda', () => {
  it('deja sólo los merge requests que coinciden', async () => {
    await mountApp()

    await wrapper.get('input[type="search"]').setValue('cálculo')

    expect(wrapper.text()).toContain('Corregir cálculo de approvals')
    expect(wrapper.text()).not.toContain('Agregar filtro por autor')
  })

  it('busca por autor', async () => {
    await mountApp()

    await wrapper.get('input[type="search"]').setValue('Ana')

    expect(wrapper.text()).toContain('Agregar filtro por autor')
    expect(wrapper.text()).not.toContain('Corregir cálculo de approvals')
  })

  it('informa cuántos merge requests quedan visibles', async () => {
    await mountApp()

    await wrapper.get('input[type="search"]').setValue('Ana')

    expect(wrapper.get('[aria-live="polite"]').text())
      .toBe('Actualización completa. Se muestran 1 de 2 merge requests.')
  })
})

describe('actualización manual', () => {
  it('fuerza la consulta omitiendo la caché del backend', async () => {
    await mountApp()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenLastCalledWith('/api/pull-requests?force=true')
  })

  it('muestra la hora de la última actualización', async () => {
    await mountApp()

    expect(wrapper.text()).toContain('Última actualización:')
    expect(wrapper.text()).toContain('Próxima actualización automática en 5 min')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { buildMergeRequest, buildResponse } from '../../../../test/fixtures/mergeRequests.js'
import { jsonResponse, resetSharedState } from '../../../../test/sharedState.js'
import { useMergeRequests } from './useMergeRequests.js'

const POLL_INTERVAL_MS = 5 * 60 * 1000

/** Componente mínimo que consume el composable como lo hace la app real. */
function mountConsumer() {
  let state = null
  const wrapper = mount(defineComponent({
    setup() {
      state = useMergeRequests()
      return () => h('div')
    },
  }))
  return { wrapper, state }
}

let state
let fetchMock

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'))
  fetchMock = vi.fn(async () => jsonResponse(buildResponse()))
  vi.stubGlobal('fetch', fetchMock)
  state = resetSharedState()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('fetchMRs', () => {
  it('guarda los merge requests y los metadatos de la respuesta', async () => {
    const payload = buildResponse([buildMergeRequest({ id: '101-1' })])
    fetchMock.mockResolvedValueOnce(jsonResponse(payload))

    await state.fetchMRs()

    expect(state.mergeRequests.value).toHaveLength(1)
    expect(state.meta.value.totalMRs).toBe(1)
    expect(state.error.value).toBeNull()
    expect(state.loading.value).toBe(false)
    expect(state.lastFetched.value).toBeInstanceOf(Date)
  })

  it('consulta el endpoint sin parámetros por defecto', async () => {
    await state.fetchMRs()

    expect(fetchMock).toHaveBeenCalledWith('/api/pull-requests')
  })

  it('agrega force=true para omitir la caché del backend', async () => {
    await state.fetchMRs(true)

    expect(fetchMock).toHaveBeenCalledWith('/api/pull-requests?force=true')
  })

  it('marca la carga mientras la petición está en curso', async () => {
    let resolveFetch
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveFetch = resolve }))

    const pending = state.fetchMRs()
    await nextTick()
    expect(state.loading.value).toBe(true)

    resolveFetch(jsonResponse(buildResponse()))
    await pending
    expect(state.loading.value).toBe(false)
  })

  it('usa el mensaje de error que devuelve el backend', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'No se pudieron obtener los merge requests de GitLab.' }, 502),
    )

    await state.fetchMRs()

    expect(state.error.value).toBe('No se pudieron obtener los merge requests de GitLab.')
    expect(state.loading.value).toBe(false)
  })

  it('usa el código HTTP cuando la respuesta de error no tiene cuerpo', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('cuerpo no es JSON') },
    })

    await state.fetchMRs()

    expect(state.error.value).toBe('Error 500')
  })

  it('informa los fallos de red', async () => {
    fetchMock.mockRejectedValueOnce(new Error('No se pudo conectar al backend.'))

    await state.fetchMRs()

    expect(state.error.value).toBe('No se pudo conectar al backend.')
  })

  it('conserva los datos previos cuando una actualización falla', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(buildResponse([buildMergeRequest()])))
    await state.fetchMRs()

    fetchMock.mockRejectedValueOnce(new Error('GitLab no respondió.'))
    await state.fetchMRs(true)

    expect(state.mergeRequests.value).toHaveLength(1)
    expect(state.error.value).toBe('GitLab no respondió.')
  })

  it('limpia el error de un intento anterior al reintentar', async () => {
    fetchMock.mockRejectedValueOnce(new Error('falló'))
    await state.fetchMRs()

    await state.fetchMRs(true)

    expect(state.error.value).toBeNull()
  })
})

describe('filteredMRs', () => {
  const mrs = [
    buildMergeRequest({
      id: '101-1', title: 'Agregar filtro por autor', author: 'Ana Pérez',
      sourceBranch: 'feature/filtro-autor', projectPath: 'equipo/tablero',
    }),
    buildMergeRequest({
      id: '202-2', title: 'Corregir cálculo de approvals', author: 'Beto Ruiz',
      sourceBranch: 'fix/approvals', targetBranch: 'develop', projectPath: 'equipo/api',
    }),
  ]

  beforeEach(async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(buildResponse(mrs)))
    await state.fetchMRs()
  })

  it('devuelve todos los MRs sin búsqueda', () => {
    expect(state.filteredMRs.value).toHaveLength(2)
  })

  it('filtra por título', () => {
    state.searchQuery.value = 'cálculo'

    expect(state.filteredMRs.value.map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('filtra por autor', () => {
    state.searchQuery.value = 'beto'

    expect(state.filteredMRs.value.map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('filtra por rama de origen y de destino', () => {
    state.searchQuery.value = 'filtro-autor'
    expect(state.filteredMRs.value.map((mr) => mr.id)).toEqual(['101-1'])

    state.searchQuery.value = 'develop'
    expect(state.filteredMRs.value.map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('filtra por ruta del proyecto', () => {
    state.searchQuery.value = 'equipo/api'

    expect(state.filteredMRs.value.map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('ignora mayúsculas y espacios sobrantes', () => {
    state.searchQuery.value = '  ANA  '

    expect(state.filteredMRs.value.map((mr) => mr.id)).toEqual(['101-1'])
  })

  it('devuelve una lista vacía cuando nada coincide', () => {
    state.searchQuery.value = 'no-existe'

    expect(state.filteredMRs.value).toEqual([])
  })
})

describe('ciclo de vida del componente', () => {
  it('carga los datos al montar', async () => {
    const { wrapper } = mountConsumer()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('actualiza automáticamente cada cinco minutos', async () => {
    const { wrapper } = mountConsumer()
    await flushPromises()

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    expect(fetchMock).toHaveBeenCalledTimes(3)

    wrapper.unmount()
  })

  it('detiene el polling al desmontar', async () => {
    const { wrapper } = mountConsumer()
    await flushPromises()

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('la actualización automática no fuerza la caché del backend', async () => {
    const { wrapper } = mountConsumer()
    await flushPromises()
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)

    expect(fetchMock).toHaveBeenLastCalledWith('/api/pull-requests')
    wrapper.unmount()
  })
})

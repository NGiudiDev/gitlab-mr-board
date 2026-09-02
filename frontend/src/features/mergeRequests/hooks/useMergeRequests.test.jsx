import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { buildMergeRequest, buildResponse } from '../../../../test/fixtures/mergeRequests.js'
import { jsonResponse, resetSharedState } from '../../../../test/sharedState.js'
import {
  fetchMergeRequests,
  getFilteredMergeRequests,
  getState,
  setSearchQuery,
  useMergeRequests,
} from './useMergeRequests.js'

const POLL_INTERVAL_MS = 5 * 60 * 1000

/** Componente mínimo que consume el hook como lo hace la app real. */
function Consumer() {
  useMergeRequests()
  return <div />
}

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

let fetchMock

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'))
  fetchMock = vi.fn(async () => jsonResponse(buildResponse()))
  vi.stubGlobal('fetch', fetchMock)
  resetSharedState()
})

afterEach(() => {
  resetSharedState()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('fetchMergeRequests', () => {
  it('guarda los merge requests y los metadatos de la respuesta', async () => {
    const payload = buildResponse([buildMergeRequest({ id: '101-1' })])
    fetchMock.mockResolvedValueOnce(jsonResponse(payload))

    await fetchMergeRequests()

    expect(getState().mergeRequests).toHaveLength(1)
    expect(getState().meta.totalMRs).toBe(1)
    expect(getState().error).toBeNull()
    expect(getState().loading).toBe(false)
    expect(getState().lastFetched).toBeInstanceOf(Date)
  })

  it('consulta el endpoint sin parámetros por defecto', async () => {
    await fetchMergeRequests()

    expect(fetchMock).toHaveBeenCalledWith('/api/pull-requests')
  })

  it('agrega force=true para omitir la caché del backend', async () => {
    await fetchMergeRequests(true)

    expect(fetchMock).toHaveBeenCalledWith('/api/pull-requests?force=true')
  })

  it('marca la carga mientras la petición está en curso', async () => {
    let resolveFetch
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveFetch = resolve }))

    const pending = fetchMergeRequests()
    expect(getState().loading).toBe(true)

    resolveFetch(jsonResponse(buildResponse()))
    await pending
    expect(getState().loading).toBe(false)
  })

  it('usa el mensaje de error que devuelve el backend', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'No se pudieron obtener los merge requests de GitLab.' }, 502),
    )

    await fetchMergeRequests()

    expect(getState().error).toBe('No se pudieron obtener los merge requests de GitLab.')
    expect(getState().loading).toBe(false)
  })

  it('usa el código HTTP cuando la respuesta de error no tiene cuerpo', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('cuerpo no es JSON') },
    })

    await fetchMergeRequests()

    expect(getState().error).toBe('Error 500')
  })

  it('informa los fallos de red', async () => {
    fetchMock.mockRejectedValueOnce(new Error('No se pudo conectar al backend.'))

    await fetchMergeRequests()

    expect(getState().error).toBe('No se pudo conectar al backend.')
  })

  it('conserva los datos previos cuando una actualización falla', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(buildResponse([buildMergeRequest()])))
    await fetchMergeRequests()

    fetchMock.mockRejectedValueOnce(new Error('GitLab no respondió.'))
    await fetchMergeRequests(true)

    expect(getState().mergeRequests).toHaveLength(1)
    expect(getState().error).toBe('GitLab no respondió.')
  })

  it('limpia el error de un intento anterior al reintentar', async () => {
    fetchMock.mockRejectedValueOnce(new Error('falló'))
    await fetchMergeRequests()

    await fetchMergeRequests(true)

    expect(getState().error).toBeNull()
  })
})

describe('filtrado por búsqueda', () => {
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
    await fetchMergeRequests()
  })

  it('devuelve todos los MRs sin búsqueda', () => {
    expect(getFilteredMergeRequests()).toHaveLength(2)
  })

  it('filtra por título', () => {
    setSearchQuery('cálculo')

    expect(getFilteredMergeRequests().map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('filtra por autor', () => {
    setSearchQuery('beto')

    expect(getFilteredMergeRequests().map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('filtra por rama de origen y de destino', () => {
    setSearchQuery('filtro-autor')
    expect(getFilteredMergeRequests().map((mr) => mr.id)).toEqual(['101-1'])

    setSearchQuery('develop')
    expect(getFilteredMergeRequests().map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('filtra por ruta del proyecto', () => {
    setSearchQuery('equipo/api')

    expect(getFilteredMergeRequests().map((mr) => mr.id)).toEqual(['202-2'])
  })

  it('ignora mayúsculas y espacios sobrantes', () => {
    setSearchQuery('  ANA  ')

    expect(getFilteredMergeRequests().map((mr) => mr.id)).toEqual(['101-1'])
  })

  it('devuelve una lista vacía cuando nada coincide', () => {
    setSearchQuery('no-existe')

    expect(getFilteredMergeRequests()).toEqual([])
  })
})

describe('ciclo de vida del componente', () => {
  it('carga los datos al montar', async () => {
    const { unmount } = render(<Consumer />)
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('actualiza automáticamente cada cinco minutos', async () => {
    const { unmount } = render(<Consumer />)
    await flush()

    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS) })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS) })
    expect(fetchMock).toHaveBeenCalledTimes(3)

    unmount()
  })

  it('detiene el polling al desmontar', async () => {
    const { unmount } = render(<Consumer />)
    await flush()

    unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3) })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('la actualización automática no fuerza la caché del backend', async () => {
    const { unmount } = render(<Consumer />)
    await flush()
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS) })

    expect(fetchMock).toHaveBeenLastCalledWith('/api/pull-requests')
    unmount()
  })

  it('un segundo consumidor no dispara otra carga inicial', async () => {
    const first = render(<Consumer />)
    const second = render(<Consumer />)
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    first.unmount()
    second.unmount()
  })

  it('mantiene el polling mientras quede algún consumidor', async () => {
    const first = render(<Consumer />)
    const second = render(<Consumer />)
    await flush()

    first.unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS) })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    second.unmount()
  })
})

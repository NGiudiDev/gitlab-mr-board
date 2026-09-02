import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { buildMergeRequest, buildResponse } from '../../test/fixtures/mergeRequests.js'
import { jsonResponse, resetSharedState } from '../../test/sharedState.js'
import App from './App.jsx'

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
let container

/** Región de estado del tablero; TopBar expone otro role="status". */
function boardStatus() {
  return container.querySelector('section[aria-labelledby="tablero-heading"] [role="status"]')
}

function liveRegion() {
  return container.querySelector('[aria-live="polite"]')
}

function searchInput() {
  return screen.getByLabelText('Buscar merge requests')
}

function refreshButton() {
  return screen.getByRole('button', { name: 'Refrescar ahora' })
}

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Monta la app y espera a que termine la carga inicial. */
async function renderApp() {
  container = render(<App />).container
  await flush()
  return container
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'))
  fetchMock = vi.fn(async () => jsonResponse(buildResponse(MRS)))
  vi.stubGlobal('fetch', fetchMock)
  resetSharedState()
})

afterEach(() => {
  container = null
  resetSharedState()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('carga inicial', () => {
  it('consulta el backend al abrir el tablero', async () => {
    await renderApp()

    expect(fetchMock).toHaveBeenCalledWith('/api/pull-requests')
  })

  it('muestra el tablero con los proyectos recibidos', async () => {
    await renderApp()

    expect(container.textContent).toContain('equipo/tablero')
    expect(container.textContent).toContain('equipo/api')
    expect(container.textContent).toContain('2 MRs en total')
  })

  it('anuncia la carga sin mover el foco', async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {}))
    await renderApp()

    expect(boardStatus().textContent).toContain('Cargando merge requests')
    expect(liveRegion().textContent).toBe('Actualizando merge requests.')
  })

  it('anuncia el resultado cuando termina de cargar', async () => {
    await renderApp()

    expect(liveRegion().textContent)
      .toBe('Actualización completa. Se muestran 2 de 2 merge requests.')
  })

  it('ofrece un enlace para saltar al contenido principal', async () => {
    await renderApp()

    const skipLink = container.querySelector('a[href="#contenido-principal"]')
    expect(skipLink.textContent).toContain('Saltar al contenido principal')
    expect(container.querySelector('main').id).toBe('contenido-principal')
  })

  it('usa un único main con encabezado accesible del tablero', async () => {
    await renderApp()

    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(container.querySelector('#tablero-heading').textContent)
      .toBe('Merge requests por proyecto y estado')
  })
})

describe('estado de error', () => {
  it('avisa que no pudo conectar y muestra el detalle', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Token inválido.' }, 502))
    await renderApp()

    const alerta = screen.getByRole('alert')
    expect(alerta.textContent).toContain('No se pudo conectar al backend.')
    expect(alerta.textContent).toContain('Token inválido.')
  })

  it('anuncia el error en la región de estado', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    await renderApp()

    expect(liveRegion().textContent).toContain('No se pudieron actualizar los datos')
  })

  it('mantiene el tablero visible si ya había datos', async () => {
    await renderApp()

    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    fireEvent.click(refreshButton())
    await flush()

    expect(screen.queryByRole('alert')).toBeNull()
    expect(container.textContent).toContain('equipo/tablero')
  })
})

describe('estado vacío', () => {
  it('avisa cuando el backend no devuelve merge requests', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(buildResponse([])))
    await renderApp()

    expect(boardStatus().textContent).toContain('Ninguna MR coincide con los filtros actuales.')
  })

  it('avisa cuando la búsqueda no encuentra coincidencias', async () => {
    await renderApp()

    fireEvent.change(searchInput(), { target: { value: 'no-existe' } })

    expect(boardStatus().textContent).toContain('Ninguna MR coincide con los filtros actuales.')
  })
})

describe('búsqueda', () => {
  it('deja sólo los merge requests que coinciden', async () => {
    await renderApp()

    fireEvent.change(searchInput(), { target: { value: 'cálculo' } })

    expect(container.textContent).toContain('Corregir cálculo de approvals')
    expect(container.textContent).not.toContain('Agregar filtro por autor')
  })

  it('busca por autor', async () => {
    await renderApp()

    fireEvent.change(searchInput(), { target: { value: 'Ana' } })

    expect(container.textContent).toContain('Agregar filtro por autor')
    expect(container.textContent).not.toContain('Corregir cálculo de approvals')
  })

  it('informa cuántos merge requests quedan visibles', async () => {
    await renderApp()

    fireEvent.change(searchInput(), { target: { value: 'Ana' } })

    expect(liveRegion().textContent)
      .toBe('Actualización completa. Se muestran 1 de 2 merge requests.')
  })
})

describe('actualización manual', () => {
  it('fuerza la consulta omitiendo la caché del backend', async () => {
    await renderApp()

    fireEvent.click(refreshButton())
    await flush()

    expect(fetchMock).toHaveBeenLastCalledWith('/api/pull-requests?force=true')
  })

  it('muestra la hora de la última actualización', async () => {
    await renderApp()

    expect(container.textContent).toContain('Última actualización:')
    expect(container.textContent).toContain('Próxima actualización automática en 5 min')
  })
})

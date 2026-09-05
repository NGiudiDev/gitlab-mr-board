import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    authorUsername: 'beto', projectPath: 'equipo/api', mergeability: 'review',
    reviewers: [{ name: 'Caro Díaz', username: 'caro', avatar: null }],
    responsiblePeople: [{ name: 'Caro Díaz', username: 'caro' }],
    blockers: { approvals: { status: 'pending', required: 2, given: 1, approvers: ['ana'] } },
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

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/pull-requests')
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
      .toBe('Actualización completa. Se muestran 2 merge requests.')
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

    expect(boardStatus().textContent).toContain('No hay merge requests abiertos.')
  })
})

describe('vista personal', () => {
  function openPersonalView() {
    fireEvent.click(screen.getByRole('button', { name: 'Personal' }))
  }

  function selectPerson(username) {
    fireEvent.change(screen.getByRole('combobox', { name: 'Persona' }), {
      target: { value: username },
    })
  }

  it('solicita elegir una persona antes de mostrar columnas', async () => {
    await renderApp()
    openPersonalView()

    expect(boardStatus().textContent).toContain('Elegí una persona')
    expect(liveRegion().textContent).toBe('Vista personal. Elegí una persona.')
  })

  it('muestra sólo las tareas donde la persona es responsable', async () => {
    await renderApp()
    openPersonalView()
    selectPerson('ana')

    expect(container.textContent).toContain('Agregar filtro por autor')
    expect(container.textContent).not.toContain('Corregir cálculo de approvals')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Tareas de Ana Pérez por estado')
    expect(container.textContent).toContain('equipo/tablero')
    expect(container.querySelectorAll('button[aria-expanded]')).toHaveLength(2)
    expect(container.querySelectorAll('section[aria-labelledby^="columna-"]')).toHaveLength(12)
    expect(container.textContent).toContain('1 MRs visibles')
    expect(liveRegion().textContent).toBe('Vista personal de Ana Pérez. Se muestran 1 merge requests.')
  })

  it('incluye las revisiones pendientes de la persona seleccionada', async () => {
    await renderApp()
    openPersonalView()
    selectPerson('caro')

    expect(container.textContent).toContain('Corregir cálculo de approvals')
    expect(container.textContent).not.toContain('Agregar filtro por autor')
  })

  it('muestra un estado vacío cuando la persona no tiene tareas', async () => {
    await renderApp()
    openPersonalView()
    selectPerson('beto')

    expect(boardStatus().textContent).toContain('No hay tareas pendientes para esta persona.')
  })

  it('conserva la persona y la vista durante una actualización manual', async () => {
    await renderApp()
    openPersonalView()
    selectPerson('ana')

    fireEvent.click(refreshButton())
    await flush()

    expect(screen.getByRole('button', { name: 'Personal' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('combobox', { name: 'Persona' }).value).toBe('ana')
    expect(container.textContent).toContain('Agregar filtro por autor')
  })

  it('recupera el tablero general sin descartar la selección', async () => {
    await renderApp()
    openPersonalView()
    selectPerson('ana')

    fireEvent.click(screen.getByRole('button', { name: 'General' }))
    expect(container.textContent).toContain('equipo/api')
    expect(container.textContent).toContain('equipo/tablero')

    openPersonalView()
    expect(screen.getByRole('combobox', { name: 'Persona' }).value).toBe('ana')
  })
})

describe('actualización manual', () => {
  it('fuerza la consulta omitiendo la caché del backend', async () => {
    await renderApp()

    fireEvent.click(refreshButton())
    await flush()

    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:3001/api/pull-requests?force=true')
  })

  it('muestra la hora de la última actualización', async () => {
    await renderApp()

    expect(container.textContent).toContain('Última actualización:')
    expect(container.textContent).toContain('Próxima actualización automática en 5 min')
  })
})

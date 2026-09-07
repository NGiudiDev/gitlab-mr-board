// 2. Dependencias externas.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import { jsonResponse } from '../../../../test/sharedState.js'
import GitlabSettingsForm from './GitlabSettingsForm.jsx'

const SETTINGS_URL = 'http://localhost:3001/api/gitlab-settings'
const ACCESS_TOKEN = 'glpat-token-de-prueba-no-real'

const STORED_SETTINGS = {
  projectIds: ['101', '202'],
  tokenHint: 'real',
  updatedAt: '2026-08-28T10:00:00.000Z',
}

let fetchMock

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Monta el formulario y espera la carga de la configuración guardada. */
async function renderForm(props = {}) {
  const { container } = render(<GitlabSettingsForm {...props} />)
  await flush()
  return container
}

/** Responde el GET inicial con la configuración indicada. */
function stubSettings(settings) {
  fetchMock.mockImplementation(async (_url, options) => {
    if (options?.method === 'PUT') return jsonResponse({ settings: settings ?? STORED_SETTINGS })

    return jsonResponse({ settings })
  })
}

/** Escribe un valor completo en un campo, reemplazando lo que hubiera. */
function fillField(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

/** Envía el formulario y espera la respuesta del backend. */
async function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Guardar configuración|Guardando/ }))
  await flush()
}

/** Cuerpo JSON enviado en la última petición de escritura. */
function lastSavedBody() {
  const [, options] = fetchMock.mock.calls.at(-1)

  return JSON.parse(options.body)
}

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse({ settings: STORED_SETTINGS }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('carga de la configuración', () => {
  it('consulta la configuración guardada con la cookie de sesión', async () => {
    await renderForm()

    expect(fetchMock).toHaveBeenCalledWith(SETTINGS_URL, { credentials: 'include' })
  })

  it('completa los proyectos ya configurados', async () => {
    await renderForm()

    expect(screen.getByLabelText('IDs de los proyectos').value).toBe('101, 202')
  })

  it('describe el token guardado sin mostrarlo', async () => {
    const container = await renderForm()

    expect(container.textContent).toContain('terminado en «real»')
    expect(screen.getByLabelText('Access token').value).toBe('')
  })

  it('arranca vacío si todavía no hay configuración', async () => {
    stubSettings(null)
    const container = await renderForm()

    expect(screen.getByLabelText('IDs de los proyectos').value).toBe('')
    expect(container.textContent).toContain('alcance read_api')
  })

  it('exige el token sólo mientras no haya uno guardado', async () => {
    stubSettings(null)
    await renderForm()

    expect(screen.getByLabelText('Access token').required).toBe(true)
  })

  it('no exige el token cuando ya hay uno guardado', async () => {
    await renderForm()

    expect(screen.getByLabelText('Access token').required).toBe(false)
  })

  it('muestra el error si la consulta falla', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Iniciá sesión.' }, 401))
    await renderForm()

    expect(screen.getByRole('alert').textContent).toBe('Iniciá sesión.')
  })
})

describe('guardado', () => {
  it('envía los proyectos y el token nuevo', async () => {
    await renderForm()

    fillField('IDs de los proyectos', '303, 404')
    fillField('Access token', ACCESS_TOKEN)
    await submit()

    expect(lastSavedBody()).toEqual({ projectIds: '303, 404', accessToken: ACCESS_TOKEN })
  })

  it('omite el token cuando el campo queda vacío, para conservar el guardado', async () => {
    await renderForm()

    fillField('IDs de los proyectos', '303')
    await submit()

    expect(lastSavedBody()).toEqual({ projectIds: '303' })
  })

  it('vacía el campo del token después de guardarlo', async () => {
    await renderForm()

    fillField('Access token', ACCESS_TOKEN)
    await submit()

    expect(screen.getByLabelText('Access token').value).toBe('')
  })

  it('confirma que la configuración quedó guardada', async () => {
    await renderForm()

    await submit()

    expect(screen.getByRole('status').textContent).toBe('Configuración de GitLab guardada.')
  })

  it('avisa al padre para que el tablero vuelva a consultar', async () => {
    const onSaved = vi.fn()
    await renderForm({ onSaved })

    await submit()

    expect(onSaved).toHaveBeenCalledTimes(1)
  })

  it('muestra el error de validación que devuelve el backend', async () => {
    await renderForm()
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: '«abc» no es un ID de proyecto.' }, 400),
    )

    fillField('IDs de los proyectos', 'abc')
    await submit()

    expect(screen.getByRole('alert').textContent).toBe('«abc» no es un ID de proyecto.')
  })

  it('no avisa al padre si el guardado falló', async () => {
    const onSaved = vi.fn()
    await renderForm({ onSaved })
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Falló.' }, 400))

    await submit()

    expect(onSaved).not.toHaveBeenCalled()
  })

  it('avisa cuando no se pudo conectar al backend', async () => {
    await renderForm()
    fetchMock.mockRejectedValueOnce(new Error('sin red'))

    await submit()

    expect(screen.getByRole('alert').textContent).toBe('No se pudo conectar al backend.')
  })
})

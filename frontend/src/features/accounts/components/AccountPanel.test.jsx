// 2. Dependencias externas.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import { jsonResponse, resetSharedState, TEST_ACCOUNT, TEST_USER } from '../../../../test/sharedState.js'
import AccountPanel from './AccountPanel.jsx'

const ACCOUNT_URL = 'http://localhost:3001/api/account'
const ADMIN_USER = { ...TEST_USER, role: 'admin' }

/** Cuenta tal como la ve un administrador: con su código de invitación. */
const ADMIN_ACCOUNT = { ...TEST_ACCOUNT, inviteCode: 'ABCD234XYZ' }

let fetchMock

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Monta el panel y espera la carga de la cuenta. */
async function renderPanel(user = ADMIN_USER) {
  const { container } = render(<AccountPanel user={user} />)
  await flush()
  return container
}

/** Responde con la cuenta indicada a la lectura y a los cambios. */
function stubAccount(account) {
  fetchMock.mockImplementation(async () => jsonResponse({ account }))
}

beforeEach(() => {
  resetSharedState()
  fetchMock = vi.fn(async () => jsonResponse({ account: ADMIN_ACCOUNT }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  resetSharedState()
  vi.unstubAllGlobals()
})

describe('carga de la cuenta', () => {
  it('consulta la cuenta con la cookie de sesión', async () => {
    await renderPanel()

    expect(fetchMock).toHaveBeenCalledWith(ACCOUNT_URL, { credentials: 'include' })
  })

  it('presenta el nombre y cuántas personas la integran', async () => {
    const container = await renderPanel()

    expect(screen.getByLabelText('Nombre de la cuenta').value).toBe('Equipo de prueba')
    expect(container.textContent).toContain('3 personas')
  })

  it('muestra el error si la consulta falla', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Iniciá sesión.' }, 401))
    await renderPanel()

    expect(screen.getByRole('alert').textContent).toBe('Iniciá sesión.')
  })
})

describe('invitación al equipo', () => {
  it('muestra el código con el que se suma el resto, listo para copiar', async () => {
    await renderPanel()

    const field = screen.getByLabelText('Código de invitación')
    expect(field.value).toBe('ABCD234XYZ')
    expect(field.readOnly).toBe(true)
  })

  it('renueva el código y avisa que el anterior dejó de servir', async () => {
    await renderPanel()
    stubAccount({ ...ADMIN_ACCOUNT, inviteCode: 'NUEVO23456' })

    fireEvent.click(screen.getByRole('button', { name: /Renovar el código/ }))
    await flush()

    const [, options] = fetchMock.mock.calls.at(-1)
    expect(options.method).toBe('POST')
    expect(screen.getByRole('status').textContent).toBe('Código de invitación renovado.')
  })
})

describe('cambio de nombre', () => {
  it('envía el nombre nuevo y confirma el guardado', async () => {
    await renderPanel()
    stubAccount({ ...ADMIN_ACCOUNT, name: 'Plataforma' })

    fireEvent.change(screen.getByLabelText('Nombre de la cuenta'), { target: { value: 'Plataforma' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar el nombre/ }))
    await flush()

    const [, options] = fetchMock.mock.calls.at(-1)
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual({ name: 'Plataforma' })
    expect(screen.getByRole('status').textContent).toBe('Nombre de la cuenta actualizado.')
  })

  it('muestra el error de validación del backend', async () => {
    await renderPanel()
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'El nombre es demasiado largo.' }, 400))

    fireEvent.click(screen.getByRole('button', { name: /Guardar el nombre/ }))
    await flush()

    expect(screen.getByRole('alert').textContent).toBe('El nombre es demasiado largo.')
  })

  it('avisa cuando no se pudo conectar al backend', async () => {
    await renderPanel()
    fetchMock.mockRejectedValueOnce(new Error('sin red'))

    fireEvent.click(screen.getByRole('button', { name: /Guardar el nombre/ }))
    await flush()

    expect(screen.getByRole('alert').textContent).toBe('No se pudo conectar al backend.')
  })
})

describe('vista de quien no administra', () => {
  it('describe la cuenta sin ofrecer cambiarla ni revelar el código', async () => {
    // El backend no devuelve el código a quien no administra.
    stubAccount(TEST_ACCOUNT)
    const container = await renderPanel(TEST_USER)

    expect(container.textContent).toContain('Equipo de prueba')
    expect(container.textContent).toContain('3 personas')
    expect(screen.queryByLabelText('Nombre de la cuenta')).toBeNull()
    expect(screen.queryByLabelText('Código de invitación')).toBeNull()
    expect(screen.queryByRole('button', { name: /Renovar el código/ })).toBeNull()
  })
})

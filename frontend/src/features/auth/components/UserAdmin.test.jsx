// 2. Dependencias externas.
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import { jsonResponse } from '../../../../test/sharedState.js'
import UserAdmin from './UserAdmin.jsx'

const USERS = [
  {
    id: 'usuario-1',
    username: 'ana',
    displayName: 'Ana Pérez',
    role: 'admin',
    status: 'active',
    createdAt: '2026-08-01T10:00:00.000Z',
    lastLoginAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'usuario-2',
    username: 'beto',
    displayName: 'Beto Ruiz',
    role: 'user',
    status: 'disabled',
    createdAt: '2026-08-02T10:00:00.000Z',
    lastLoginAt: null,
  },
]

let fetchMock

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Monta la pantalla y espera la carga de la lista. */
async function renderUserAdmin(currentUsername = 'ana') {
  const result = render(<UserAdmin currentUsername={currentUsername} />)
  await flush()

  return result
}

/** Fila de la tabla que corresponde al usuario indicado. */
function rowFor(username) {
  return screen.getByRole('rowheader', { name: `@${username}` }).closest('tr')
}

/** Completa el alta con datos válidos y la envía. */
async function submitNewUser() {
  await userEvent.type(screen.getByLabelText('Usuario'), 'zoe')
  await userEvent.type(screen.getByLabelText('Contraseña inicial'), 'contrasena-de-prueba')
  await userEvent.click(screen.getByRole('button', { name: /Crear usuario|Creando/ }))
  await flush()
}

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse({ users: USERS }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('lista de usuarios', () => {
  it('consulta la lista enviando la cookie de sesión', async () => {
    await renderUserAdmin()

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/users', {
      credentials: 'include',
    })
  })

  it('presenta rol, estado y último ingreso en texto', async () => {
    const { container } = await renderUserAdmin()

    expect(rowFor('ana').textContent).toContain('Administrador')
    expect(rowFor('ana').textContent).toContain('Habilitado')
    expect(rowFor('beto').textContent).toContain('Usuario')
    expect(rowFor('beto').textContent).toContain('Deshabilitado')
    expect(rowFor('beto').textContent).toContain('Nunca')
    expect(container.querySelector('caption').textContent).toContain('Personas de la cuenta')
  })

  it('avisa mientras carga', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    render(<UserAdmin currentUsername="ana" />)

    expect(screen.getByRole('status').textContent).toContain('Cargando usuarios...')
  })

  it('muestra el error cuando la consulta falla', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Necesitás permisos de administrador.' }, 403))
    await renderUserAdmin()

    expect(screen.getByRole('alert').textContent).toBe('Necesitás permisos de administrador.')
  })
})

describe('alta de usuarios', () => {
  it('envía el alta con el rol elegido y recarga la lista', async () => {
    await renderUserAdmin()
    fetchMock.mockClear()
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { username: 'zoe' } }, 201))

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'admin')
    await submitNewUser()

    expect(fetchMock.mock.calls[0]).toEqual(['http://localhost:3001/api/users', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'zoe', displayName: '', password: 'contrasena-de-prueba', role: 'admin' }),
    }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('confirma el alta y limpia el formulario', async () => {
    await renderUserAdmin()
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { username: 'zoe' } }, 201))

    await submitNewUser()

    expect(screen.getByRole('status').textContent).toBe('Usuario «zoe» creado.')
    expect(screen.getByLabelText('Usuario').value).toBe('')
  })

  it('muestra el error del backend y conserva lo escrito', async () => {
    await renderUserAdmin()
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Ya existe un usuario con el nombre «zoe».' }, 409))

    await submitNewUser()

    expect(screen.getByRole('alert').textContent).toBe('Ya existe un usuario con el nombre «zoe».')
    expect(screen.getByLabelText('Usuario').value).toBe('zoe')
  })
})

describe('acciones por usuario', () => {
  it('deshabilita a un usuario habilitado', async () => {
    // La sesión es de otra persona: el botón de la propia cuenta está bloqueado.
    await renderUserAdmin('otra')
    fetchMock.mockClear()
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: USERS[1] }))

    await userEvent.click(screen.getByRole('button', { name: 'Deshabilitar' }))
    await flush()

    expect(fetchMock.mock.calls[0]).toEqual(['http://localhost:3001/api/users/ana/status', {
      credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'disabled' }),
    }])
  })

  it('habilita a un usuario deshabilitado', async () => {
    await renderUserAdmin('otra')
    fetchMock.mockClear()
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: USERS[1] }))

    await userEvent.click(screen.getByRole('button', { name: 'Habilitar' }))
    await flush()

    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ status: 'active' }))
    expect(screen.getByRole('status').textContent).toBe('Usuario «beto» habilitado.')
  })

  it('no deja cambiar el estado de la propia cuenta', async () => {
    await renderUserAdmin('ana')

    const ownToggle = rowFor('ana').querySelector('button')
    expect(ownToggle.disabled).toBe(true)
    expect(ownToggle.getAttribute('title')).toContain('tu propia cuenta')
  })

  it('no ofrece restablecer la contraseña desde la tabla', async () => {
    await renderUserAdmin()

    expect(screen.queryByRole('button', { name: /Restablecer/ })).toBeNull()
    expect(rowFor('beto').querySelectorAll('button')).toHaveLength(1)
  })
})

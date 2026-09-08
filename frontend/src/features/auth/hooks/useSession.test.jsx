// 2. Dependencias externas.
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 6. Imports relativos restantes.
import { jsonResponse, resetSharedState, TEST_USER } from '../../../../test/sharedState.js'
import {
  changeOwnPassword,
  expireSession,
  getState,
  login,
  logout,
  PASSWORD_CHANGED_MESSAGE,
  register,
  saveGitlabUsername,
  SESSION_EXPIRED_MESSAGE,
  useSession,
} from './useSession.js'

/** Componente mínimo que consume el hook como lo hace la app real. */
function Consumer() {
  useSession()
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
  fetchMock = vi.fn(async () => jsonResponse({ user: TEST_USER }))
  vi.stubGlobal('fetch', fetchMock)
  resetSharedState()
})

afterEach(() => {
  resetSharedState()
  vi.unstubAllGlobals()
})

describe('carga inicial', () => {
  it('arranca verificando la sesión', () => {
    expect(getState().status).toBe('checking')
    expect(getState().user).toBeNull()
  })

  it('consulta la sesión enviando la cookie', async () => {
    render(<Consumer />)
    await flush()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/me',
      { credentials: 'include' },
    )
  })

  it('guarda el usuario cuando hay una sesión abierta', async () => {
    render(<Consumer />)
    await flush()

    expect(getState().status).toBe('authenticated')
    expect(getState().user).toEqual(TEST_USER)
  })

  it('queda anónimo cuando el backend responde 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Iniciá sesión.' }, 401))
    render(<Consumer />)
    await flush()

    expect(getState().status).toBe('anonymous')
    expect(getState().error).toBeNull()
  })

  it('avisa cuando no puede conectarse al backend', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    render(<Consumer />)
    await flush()

    expect(getState().status).toBe('anonymous')
    expect(getState().error).toBe('No se pudo conectar al backend.')
  })

  it('consulta una sola vez aunque se monten varios consumidores', async () => {
    render(<><Consumer /><Consumer /></>)
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('no vuelve a consultar si la sesión ya se resolvió', async () => {
    render(<Consumer />)
    await flush()

    render(<Consumer />)
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('login', () => {
  it('envía las credenciales como JSON con la cookie habilitada', async () => {
    await login({ username: 'ana', password: 'contrasena-de-prueba' })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/auth/login', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ana', password: 'contrasena-de-prueba' }),
    })
  })

  it('deja la sesión abierta cuando el backend acepta', async () => {
    const result = await login({ username: 'ana', password: 'contrasena-de-prueba' })

    expect(result).toBe(true)
    expect(getState().status).toBe('authenticated')
    expect(getState().user).toEqual(TEST_USER)
    expect(getState().submitting).toBe(false)
  })

  it('muestra el mensaje del backend cuando rechaza las credenciales', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Usuario o contraseña incorrectos.' }, 401))

    const result = await login({ username: 'ana', password: 'incorrecta' })

    expect(result).toBe(false)
    expect(getState().status).toBe('anonymous')
    expect(getState().error).toBe('Usuario o contraseña incorrectos.')
  })

  it('usa el código HTTP cuando la respuesta no trae mensaje', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse('no es json', 500))

    await login({ username: 'ana', password: 'contrasena-de-prueba' })

    expect(getState().error).toBe('Error 500')
  })

  it('avisa cuando la petición falla por red', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))

    const result = await login({ username: 'ana', password: 'contrasena-de-prueba' })

    expect(result).toBe(false)
    expect(getState().error).toBe('No se pudo conectar al backend.')
    expect(getState().submitting).toBe(false)
  })

  it('marca el envío en curso mientras espera al backend', async () => {
    let resolveRequest
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveRequest = resolve }))

    const pending = login({ username: 'ana', password: 'contrasena-de-prueba' })
    expect(getState().submitting).toBe(true)

    resolveRequest(jsonResponse({ user: TEST_USER }))
    await pending

    expect(getState().submitting).toBe(false)
  })
})

describe('logout', () => {
  it('avisa al backend y deja la app anónima', async () => {
    await login({ username: 'ana', password: 'contrasena-de-prueba' })

    await logout()

    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:3001/api/auth/logout', {
      credentials: 'include',
      method: 'POST',
    })
    expect(getState().status).toBe('anonymous')
    expect(getState().user).toBeNull()
  })

  it('cierra la sesión local aunque falle la petición', async () => {
    await login({ username: 'ana', password: 'contrasena-de-prueba' })
    fetchMock.mockRejectedValueOnce(new Error('sin red'))

    await logout()

    expect(getState().status).toBe('anonymous')
    expect(getState().error).toBeNull()
  })
})

describe('expireSession', () => {
  it('pide volver a ingresar cuando la sesión venció', async () => {
    await login({ username: 'ana', password: 'contrasena-de-prueba' })

    expireSession()

    expect(getState().status).toBe('anonymous')
    expect(getState().user).toBeNull()
    expect(getState().error).toBe(SESSION_EXPIRED_MESSAGE)
  })

  it('no pisa el estado si ya estaba anónimo', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Iniciá sesión.' }, 401))
    render(<Consumer />)
    await flush()

    expireSession()

    expect(getState().error).toBeNull()
  })
})

describe('register', () => {
  it('envía el alta como JSON con la cookie habilitada', async () => {
    await register({
      username: 'zoe',
      password: 'contrasena-de-prueba',
      displayName: 'Zoe Ruiz',
      accountName: 'Plataforma',
    })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/auth/register', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'zoe',
        password: 'contrasena-de-prueba',
        displayName: 'Zoe Ruiz',
        accountName: 'Plataforma',
      }),
    })
  })

  it('manda el código de invitación cuando el alta se suma a un equipo', async () => {
    await register({ username: 'zoe', password: 'contrasena-de-prueba', inviteCode: 'ABCD234XYZ' })

    const [, options] = fetchMock.mock.calls.at(-1)
    expect(JSON.parse(options.body).inviteCode).toBe('ABCD234XYZ')
  })

  it('deja la sesión abierta cuando el backend acepta el alta', async () => {
    const result = await register({ username: 'ana', password: 'contrasena-de-prueba' })

    expect(result).toBe(true)
    expect(getState().status).toBe('authenticated')
    expect(getState().user).toEqual(TEST_USER)
  })

  it('muestra el mensaje del backend cuando el nombre ya está tomado', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Ya existe un usuario con el nombre «ana».' }, 409))

    const result = await register({ username: 'ana', password: 'contrasena-de-prueba' })

    expect(result).toBe(false)
    expect(getState().status).toBe('anonymous')
    expect(getState().error).toBe('Ya existe un usuario con el nombre «ana».')
  })
})

describe('saveGitlabUsername', () => {
  it('envía el nickname y guarda la identidad que devuelve el backend', async () => {
    const updated = { ...TEST_USER, gitlabUsername: 'otro-nick' }
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: updated }))

    const failure = await saveGitlabUsername('otro-nick')

    expect(failure).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/auth/gitlab-username', {
      credentials: 'include',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gitlabUsername: 'otro-nick' }),
    })
    expect(getState().user).toEqual(updated)
  })

  it('devuelve el mensaje del backend sin tocar la sesión', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Indicá tu nickname de GitLab.' }, 400))

    const failure = await saveGitlabUsername('')

    expect(failure).toBe('Indicá tu nickname de GitLab.')
    expect(getState().user).toBeNull()
  })

  it('avisa cuando no se pudo conectar al backend', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))

    expect(await saveGitlabUsername('otro-nick')).toBe('No se pudo conectar al backend.')
  })
})

describe('changeOwnPassword', () => {
  it('envía la contraseña actual y la nueva', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204))

    await changeOwnPassword({ currentPassword: 'vieja-contrasena', newPassword: 'nueva-contrasena' })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/auth/password', {
      credentials: 'include',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'vieja-contrasena', newPassword: 'nueva-contrasena' }),
    })
  })

  it('cierra la sesión y avisa que hay que volver a ingresar', async () => {
    await login({ username: 'ana', password: 'contrasena-de-prueba' })
    fetchMock.mockResolvedValueOnce(jsonResponse(null, 204))

    const failure = await changeOwnPassword({
      currentPassword: 'contrasena-de-prueba',
      newPassword: 'nueva-contrasena',
    })

    expect(failure).toBeNull()
    expect(getState().status).toBe('anonymous')
    expect(getState().user).toBeNull()
    expect(getState().notice).toBe(PASSWORD_CHANGED_MESSAGE)
  })

  it('devuelve el error y conserva la sesión cuando el backend rechaza', async () => {
    await login({ username: 'ana', password: 'contrasena-de-prueba' })
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'La contraseña actual no coincide.' }, 403))

    const failure = await changeOwnPassword({
      currentPassword: 'incorrecta',
      newPassword: 'nueva-contrasena',
    })

    expect(failure).toBe('La contraseña actual no coincide.')
    expect(getState().status).toBe('authenticated')
  })

  it('devuelve el aviso de red cuando la petición falla', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))

    const failure = await changeOwnPassword({
      currentPassword: 'vieja-contrasena',
      newPassword: 'nueva-contrasena',
    })

    expect(failure).toBe('No se pudo conectar al backend.')
  })
})

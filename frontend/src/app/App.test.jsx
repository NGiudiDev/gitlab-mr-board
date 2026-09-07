// 2. Dependencias externas.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 7. Imports relativos restantes.
import { buildMergeRequest, buildResponse } from '../../test/fixtures/mergeRequests.js'
import { jsonResponse, resetSharedState, signInTestUser, TEST_USER } from '../../test/sharedState.js'
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

/** Configuración de GitLab que el backend devuelve para el usuario de prueba. */
const GITLAB_SETTINGS = {
  projectIds: ['101', '202'],
  tokenHint: 'real',
}

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
  signInTestUser()
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

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/pull-requests', { credentials: 'include' })
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

    expect(fetchMock).toHaveBeenLastCalledWith('http://localhost:3001/api/pull-requests?force=true', { credentials: 'include' })
  })

  it('muestra la hora de la última actualización', async () => {
    await renderApp()

    expect(container.textContent).toContain('Última actualización:')
    expect(container.textContent).toContain('Próxima actualización automática en 5 min')
  })
})

describe('portero de sesión', () => {
  /** Responde como el backend: la sesión por un lado y el tablero por otro. */
  function routeApi(responses = {}) {
    const {
      me = jsonResponse({ user: TEST_USER }),
      login = jsonResponse({ user: TEST_USER }),
      logout = jsonResponse(null, 204),
      register = jsonResponse({ user: TEST_USER }, 201),
      users = jsonResponse({ users: [] }),
      board = jsonResponse(buildResponse(MRS)),
    } = responses

    return vi.fn(async (url) => {
      const path = String(url)
      if (path.endsWith('/api/auth/me')) return me
      if (path.endsWith('/api/auth/login')) return login
      if (path.endsWith('/api/auth/logout')) return logout
      if (path.endsWith('/api/auth/register')) return register
      if (path.includes('/api/users')) return users
      return board
    })
  }

  function loginForm() {
    return screen.queryByRole('button', { name: /Ingresar|Ingresando/ })
  }

  /** Completa y envía el formulario de ingreso. */
  function submitCredentials(username = 'ana', password = 'contrasena-de-prueba') {
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: username } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
    fireEvent.click(loginForm())
  }

  beforeEach(() => {
    // Deshace la sesión que precargan las pruebas del tablero.
    resetSharedState()
  })

  it('avisa que está verificando la sesión antes de decidir qué mostrar', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    container = render(<App />).container

    expect(container.textContent).toContain('Verificando tu sesión...')
    expect(loginForm()).toBeNull()
  })

  it('muestra el login cuando no hay sesión abierta', async () => {
    fetchMock.mockImplementation(routeApi({ me: jsonResponse({ error: 'Iniciá sesión.' }, 401) }))
    await renderApp()

    expect(loginForm()).not.toBeNull()
    expect(container.textContent).not.toContain('Tablero de MRs · ')
  })

  it('no consulta el tablero mientras no haya sesión', async () => {
    fetchMock.mockImplementation(routeApi({ me: jsonResponse({ error: 'Iniciá sesión.' }, 401) }))
    await renderApp()

    const boardCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/pull-requests'))
    expect(boardCalls).toHaveLength(0)
  })

  it('muestra el tablero después de ingresar', async () => {
    fetchMock.mockImplementation(routeApi({ me: jsonResponse({ error: 'Iniciá sesión.' }, 401) }))
    await renderApp()

    submitCredentials()
    await flush()

    expect(loginForm()).toBeNull()
    expect(container.textContent).toContain('equipo/tablero')
    expect(container.textContent).toContain('Ana Pérez')
  })

  it('vuelve al login con el mensaje del backend si las credenciales no sirven', async () => {
    fetchMock.mockImplementation(routeApi({
      me: jsonResponse({ error: 'Iniciá sesión.' }, 401),
      login: jsonResponse({ error: 'Usuario o contraseña incorrectos.' }, 401),
    }))
    await renderApp()

    submitCredentials('ana', 'incorrecta')
    await flush()

    expect(screen.getByRole('alert').textContent).toBe('Usuario o contraseña incorrectos.')
    expect(loginForm()).not.toBeNull()
  })

  it('cierra la sesión y descarta los datos del tablero', async () => {
    fetchMock.mockImplementation(routeApi())
    signInTestUser()
    await renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await flush()

    expect(loginForm()).not.toBeNull()
    expect(container.textContent).not.toContain('equipo/tablero')
  })

  it('devuelve al login cuando el tablero responde 401', async () => {
    fetchMock.mockImplementation(routeApi({ board: jsonResponse({ error: 'Iniciá sesión.' }, 401) }))
    signInTestUser()
    await renderApp()

    expect(loginForm()).not.toBeNull()
    expect(screen.getByRole('alert').textContent).toBe('Tu sesión expiró. Volvé a ingresar.')
  })
})

describe('alta de cuenta desde el tablero', () => {
  /** Responde como el backend, con el alta y la lista de usuarios incluidas. */
  function routeApi(responses = {}) {
    const {
      me = jsonResponse({ error: 'Iniciá sesión.' }, 401),
      register = jsonResponse({ user: TEST_USER }, 201),
      users = jsonResponse({ users: [] }),
      board = jsonResponse(buildResponse(MRS)),
    } = responses

    return vi.fn(async (url) => {
      const path = String(url)
      if (path.endsWith('/api/auth/me')) return me
      if (path.endsWith('/api/auth/register')) return register
      if (path.includes('/api/users')) return users
      return board
    })
  }

  /** Completa el formulario de alta y lo envía. */
  function submitRegistration() {
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'contrasena-de-prueba' } })
    fireEvent.change(screen.getByLabelText('Repetí la contraseña'), { target: { value: 'contrasena-de-prueba' } })
    fireEvent.click(screen.getByRole('button', { name: /Crear cuenta|Creando/ }))
  }

  beforeEach(() => {
    resetSharedState()
  })

  it('ofrece el alta desde el formulario de ingreso', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Crear una cuenta')
  })

  it('vuelve al ingreso desde el alta', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }))

    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tablero de MRs')
  })

  it('crea la cuenta y entra directo al tablero', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }))

    submitRegistration()
    await flush()

    expect(container.textContent).toContain('equipo/tablero')
    expect(screen.queryByRole('button', { name: /Crear cuenta/ })).toBeNull()
  })

  it('muestra el error del backend sin salir del alta', async () => {
    fetchMock.mockImplementation(routeApi({
      register: jsonResponse({ error: 'Ya existe un usuario con el nombre «ana».' }, 409),
    }))
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }))

    submitRegistration()
    await flush()

    expect(screen.getByRole('alert').textContent).toBe('Ya existe un usuario con el nombre «ana».')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Crear una cuenta')
  })
})

describe('navegación entre secciones', () => {
  function routeApi(users = []) {
    return vi.fn(async (url) => {
      const path = String(url)
      if (path.endsWith('/api/auth/me')) return jsonResponse({ user: TEST_USER })
      if (path.includes('/api/users')) return jsonResponse({ users })
      if (path.includes('/api/gitlab-settings')) return jsonResponse({ settings: GITLAB_SETTINGS })
      return jsonResponse(buildResponse(MRS))
    })
  }

  /** Abre una sección desde la barra de navegación del layout. */
  async function openSection(label) {
    fireEvent.click(screen.getByRole('button', { name: label }))
    await flush()
  }

  it('abre la cuenta y vuelve al tablero', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()

    await openSection('Mi cuenta')

    expect(screen.getByRole('heading', { level: 2, name: 'Mi contraseña' })).toBeDefined()
    expect(container.textContent).not.toContain('equipo/tablero')

    await openSection('Tablero')

    expect(container.textContent).toContain('equipo/tablero')
  })

  it('reúne en la cuenta la configuración de GitLab y la contraseña', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()

    await openSection('Mi cuenta')

    expect(screen.getByRole('heading', { level: 2, name: 'GitLab' })).toBeDefined()
    expect(screen.getByRole('heading', { level: 2, name: 'Mi contraseña' })).toBeDefined()
    expect(screen.getByLabelText('IDs de los proyectos').value).toBe('101, 202')
  });

  it('lleva a la cuenta cuando falta configurar GitLab', async () => {
    fetchMock.mockImplementation(async (url) => {
      const path = String(url)
      if (path.endsWith('/api/auth/me')) return jsonResponse({ user: TEST_USER })
      if (path.includes('/api/gitlab-settings')) return jsonResponse({ settings: null })
      return jsonResponse(
        { error: 'Configurá tus datos de GitLab.', code: 'gitlab_settings_missing' },
        409,
      )
    })
    await renderApp()

    expect(container.textContent).toContain('Todavía no configuraste GitLab')

    fireEvent.click(screen.getByRole('button', { name: 'Configurar en Mi cuenta' }))
    await flush()

    expect(screen.getByRole('heading', { level: 2, name: 'GitLab' })).toBeDefined()
  });

  it('actualiza el tablero apenas se guarda la configuración de GitLab', async () => {
    let configured = false
    fetchMock.mockImplementation(async (url, options) => {
      const path = String(url)
      if (path.endsWith('/api/auth/me')) return jsonResponse({ user: TEST_USER })
      if (path.includes('/api/gitlab-settings')) {
        if (options?.method === 'PUT') configured = true
        return jsonResponse({ settings: configured ? GITLAB_SETTINGS : null })
      }
      if (configured) return jsonResponse(buildResponse(MRS))
      return jsonResponse({ code: 'gitlab_settings_missing' }, 409)
    })
    await renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Configurar en Mi cuenta' }))
    await flush()
    fireEvent.change(screen.getByLabelText('IDs de los proyectos'), { target: { value: '101' } })
    fireEvent.change(screen.getByLabelText('Access token'), { target: { value: 'glpat-token-de-prueba' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }))
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Tablero' }))
    await flush()

    expect(container.textContent).toContain('equipo/tablero')
  });

  it('no ofrece la sección de usuarios a quien no es admin', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()

    expect(screen.queryByRole('button', { name: 'Usuarios' })).toBeNull()
  })

  it('abre la administración de usuarios para un admin', async () => {
    fetchMock.mockImplementation(routeApi())
    signInTestUser({ ...TEST_USER, role: 'admin' })
    await renderApp()

    await openSection('Usuarios')

    expect(screen.getByRole('heading', { level: 2, name: 'Usuarios' })).toBeDefined()
    expect(container.textContent).not.toContain('equipo/tablero')
  })

  it('mantiene la sección activa marcada en la barra', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()

    await openSection('Mi cuenta')

    expect(screen.getByRole('button', { name: 'Mi cuenta' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Tablero' }).getAttribute('aria-current')).toBeNull()
  })

  it('vuelve al tablero al abrir una sesión nueva', async () => {
    fetchMock.mockImplementation(routeApi())
    await renderApp()
    await openSection('Mi cuenta')

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await flush()
    signInTestUser()
    await flush()

    expect(container.textContent).toContain('equipo/tablero')
  })
})

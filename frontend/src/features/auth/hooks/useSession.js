// 2. Dependencias externas.
import { useEffect, useSyncExternalStore } from 'react'

// 7. Imports relativos restantes.
import config from '../../../config.js'

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Volvé a ingresar.'
const PASSWORD_CHANGED_MESSAGE = 'Contraseña actualizada. Volvé a ingresar con la nueva.'
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar al backend.'

const INITIAL_STATE = {
  user: null,
  /** `checking` mientras se consulta la sesión, para no parpadear el login. */
  status: 'checking',
  error: null,
  /** Aviso que no es un fallo, como el cambio de contraseña ya aplicado. */
  notice: null,
  submitting: false,
}

/**
 * Mismo patrón que el store del tablero: el estado vive a nivel de módulo y
 * `useSyncExternalStore` lo conecta a React sin provider ni librería externa.
 */
let state = INITIAL_STATE
const listeners = new Set()

function getState() {
  return state
}

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Consulta de sesión en curso. Evita que el doble montaje de StrictMode dispare
// dos peticiones para el mismo arranque.
let sessionCheck = null

/**
 * Llama al backend enviando la cookie de sesión.
 *
 * @param {string} path Ruta bajo la URL base de la API.
 * @param {RequestInit} [options] Opciones adicionales de `fetch`.
 * @returns {Promise<Response>} Respuesta cruda, para que cada acción decida.
 */
function requestSession(path, options = {}) {
  // La sesión viaja en una cookie HttpOnly: sin `credentials` el navegador no
  // la manda, porque el backend está en otro puerto.
  return fetch(`${config.apiBaseUrl}${path}`, { credentials: 'include', ...options })
}

/**
 * Lee el mensaje de error que devolvió el backend.
 *
 * @param {Response} response Respuesta con código de error.
 * @returns {Promise<string>} Mensaje en español para mostrar en la UI.
 */
async function readErrorMessage(response) {
  const body = await response.json().catch(() => ({}))

  return body.error || `Error ${response.status}`
}

/** Consulta si hay una sesión abierta al arrancar la app. */
async function loadSession() {
  try {
    const response = await requestSession('/api/auth/me')

    if (response.ok) {
      const { user } = await response.json()
      setState({ user, status: 'authenticated', error: null })
      return
    }

    setState({ user: null, status: 'anonymous', error: null })
  } catch {
    setState({ user: null, status: 'anonymous', error: NETWORK_ERROR_MESSAGE })
  }
}

function loadSessionOnce() {
  // Una vez resuelto el arranque, el estado de la sesión lo cambian el login,
  // el logout o un 401 del tablero. Volver a preguntar sería ruido.
  if (state.status !== 'checking') return Promise.resolve()
  if (sessionCheck) return sessionCheck

  sessionCheck = loadSession().finally(() => {
    sessionCheck = null
  })
  return sessionCheck
}

/**
 * Envía credenciales a una ruta que devuelve una sesión abierta.
 *
 * El login y el registro comparten todo salvo la ruta y los datos enviados.
 *
 * @param {string} path Ruta del backend que abre la sesión.
 * @param {object} body Cuerpo a enviar como JSON.
 * @returns {Promise<boolean>} `true` si la sesión quedó abierta.
 */
async function openSession(path, body) {
  setState({ submitting: true, error: null })

  try {
    const response = await requestSession(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      setState({ error: await readErrorMessage(response), status: 'anonymous', user: null })
      return false
    }

    const { user } = await response.json()
    setState({ user, status: 'authenticated', error: null, notice: null })
    return true
  } catch {
    setState({ error: NETWORK_ERROR_MESSAGE, status: 'anonymous', user: null })
    return false
  } finally {
    setState({ submitting: false })
  }
}

/**
 * Inicia sesión con usuario y contraseña.
 *
 * @param {{ username: string, password: string }} credentials Datos del formulario.
 * @returns {Promise<boolean>} `true` si la sesión quedó abierta.
 */
function login({ username, password }) {
  return openSession('/api/auth/login', { username, password })
}

/**
 * Da de alta un usuario y deja la sesión abierta.
 *
 * Con `inviteCode` se suma a la cuenta de ese código; sin él crea una cuenta
 * nueva con el nombre indicado y queda como su administrador.
 *
 * @param {{ username: string, password: string, displayName?: string, accountName?: string, inviteCode?: string }} input Datos del alta.
 * @returns {Promise<boolean>} `true` si el alta se hizo y la sesión quedó abierta.
 */
function register({ username, password, displayName, accountName, inviteCode }) {
  return openSession('/api/auth/register', {
    username,
    password,
    displayName,
    accountName,
    inviteCode,
  })
}

/**
 * Guarda el nickname de GitLab de la propia persona.
 *
 * Es lo único de GitLab que no es de la cuenta: con él la vista personal sabe
 * cuáles de los merge requests del equipo son de quien mira.
 *
 * @param {string} gitlabUsername Nickname tal como lo escribió la persona.
 * @returns {Promise<string | null>} El mensaje de error, o `null` si se guardó.
 */
async function saveGitlabUsername(gitlabUsername) {
  setState({ submitting: true })

  try {
    const response = await requestSession('/api/auth/gitlab-username', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gitlabUsername }),
    })

    if (!response.ok) return await readErrorMessage(response)

    const { user } = await response.json()
    setState({ user })
    return null
  } catch {
    return NETWORK_ERROR_MESSAGE
  } finally {
    setState({ submitting: false })
  }
}

/**
 * Cambia la contraseña propia. El backend cierra todas las sesiones, así que
 * al terminar la app vuelve al login con el aviso correspondiente.
 *
 * @param {{ currentPassword: string, newPassword: string }} input Contraseña actual y nueva.
 * @returns {Promise<string | null>} El mensaje de error, o `null` si se aplicó.
 */
async function changeOwnPassword({ currentPassword, newPassword }) {
  setState({ submitting: true, error: null })

  try {
    const response = await requestSession('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    if (!response.ok) return await readErrorMessage(response)

    setState({ user: null, status: 'anonymous', error: null, notice: PASSWORD_CHANGED_MESSAGE })
    return null
  } catch {
    return NETWORK_ERROR_MESSAGE
  } finally {
    setState({ submitting: false })
  }
}

/** Cierra la sesión en el backend y deja la app en el login. */
async function logout() {
  try {
    await requestSession('/api/auth/logout', { method: 'POST' })
  } catch {
    // Aunque falle la red conviene soltar la sesión local: el token vence solo.
  }

  setState({ user: null, status: 'anonymous', error: null, notice: null })
}

/**
 * Marca la sesión como terminada sin llamar al backend.
 * La usa el tablero cuando la API responde 401.
 */
function expireSession() {
  if (state.status === 'anonymous') return

  setState({ user: null, status: 'anonymous', error: SESSION_EXPIRED_MESSAGE, notice: null })
}

/**
 * Deja el store como al arrancar la app. Sólo para test.
 *
 * @param {object} [overrides] Estado inicial a fijar, por ejemplo una sesión
 * ya abierta para las pruebas del tablero.
 */
function resetSessionStore(overrides = {}) {
  sessionCheck = null
  state = INITIAL_STATE
  setState(overrides)
}

function useSession() {
  const snapshot = useSyncExternalStore(subscribe, getState)

  useEffect(() => {
    loadSessionOnce()
  }, [])

  return { ...snapshot, changeOwnPassword, login, logout, register, saveGitlabUsername }
}

export {
  changeOwnPassword,
  expireSession,
  getState,
  login,
  logout,
  PASSWORD_CHANGED_MESSAGE,
  register,
  resetSessionStore,
  saveGitlabUsername,
  SESSION_EXPIRED_MESSAGE,
  useSession,
}

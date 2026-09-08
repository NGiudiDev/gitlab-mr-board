// 2. Dependencias externas.
import { useEffect, useSyncExternalStore } from 'react'

// 7. Imports relativos restantes.
import config from '../../../config.js'

const NETWORK_ERROR_MESSAGE = 'No se pudo conectar al backend.'

const INITIAL_STATE = {
  /** Cuenta de la sesión, o `null` mientras no se cargó. */
  account: null,
  loading: false,
  error: null,
  submitting: false,
}

/**
 * La cuenta la miran dos lugares —la barra superior y la pantalla de cuenta—,
 * así que vive en un store con el mismo patrón que la sesión y el tablero, y
 * no en el estado local de un componente.
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

// Carga en curso. Evita que el doble montaje de StrictMode, o un segundo
// consumidor del hook, disparen dos peticiones para la misma cuenta.
let pendingLoad = null

/**
 * Llama a la API de la cuenta con la cookie de sesión.
 *
 * @param {string} [path] Ruta bajo `/api/account`.
 * @param {RequestInit & { body?: object }} [options] Método y cuerpo.
 * @returns {Promise<Response>} Respuesta cruda.
 */
function requestAccount(path = '', options = {}) {
  const { body, ...rest } = options

  return fetch(`${config.apiBaseUrl}/api/account${path}`, {
    credentials: 'include',
    ...(body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ...rest,
  })
}

/**
 * Lee el mensaje que devolvió el backend.
 *
 * @param {Response} response Respuesta con código de error.
 * @returns {Promise<string>} Mensaje en español para mostrar en la UI.
 */
async function readErrorMessage(response) {
  const body = await response.json().catch(() => ({}))

  return body.error || `Error ${response.status}`
}

/** Trae la cuenta de la sesión abierta. */
async function loadAccount() {
  setState({ loading: true })

  try {
    const response = await requestAccount()

    if (!response.ok) {
      setState({ error: await readErrorMessage(response) })
      return
    }

    const { account } = await response.json()
    setState({ account, error: null })
  } catch {
    setState({ error: NETWORK_ERROR_MESSAGE })
  } finally {
    setState({ loading: false })
  }
}

/**
 * Carga la cuenta indicada si no es la que ya está en el store.
 *
 * Se compara contra el `accountId` de la sesión en lugar de cargar una sola
 * vez: al cerrar sesión y entrar con otro usuario, el store todavía tiene la
 * cuenta anterior.
 *
 * @param {string | null} accountId Cuenta de la sesión en curso.
 * @returns {Promise<void>} Se resuelve cuando la carga termina.
 */
function loadAccountOnce(accountId) {
  if (!accountId) return Promise.resolve()
  if (state.account?.id === accountId) return Promise.resolve()
  if (pendingLoad) return pendingLoad

  pendingLoad = loadAccount().finally(() => {
    pendingLoad = null
  })
  return pendingLoad
}

/**
 * Envía un cambio sobre la cuenta y guarda la versión que devuelve el backend.
 *
 * @param {RequestInit & { body?: object }} options Método, ruta y cuerpo.
 * @param {string} [path] Ruta bajo `/api/account`.
 * @returns {Promise<string | null>} El mensaje de error, o `null` si se aplicó.
 */
async function submitChange(options, path = '') {
  setState({ submitting: true })

  try {
    const response = await requestAccount(path, options)
    if (!response.ok) return await readErrorMessage(response)

    const { account } = await response.json()
    setState({ account, error: null })
    return null
  } catch {
    return NETWORK_ERROR_MESSAGE
  } finally {
    setState({ submitting: false })
  }
}

/**
 * Cambia el nombre de la cuenta. Sólo lo acepta el backend a un administrador.
 *
 * @param {string} name Nombre nuevo.
 * @returns {Promise<string | null>} El mensaje de error, o `null` si se aplicó.
 */
function renameAccount(name) {
  return submitChange({ method: 'PATCH', body: { name } })
}

/**
 * Renueva el código de invitación y deja sin efecto el anterior.
 *
 * @returns {Promise<string | null>} El mensaje de error, o `null` si se aplicó.
 */
function rotateInviteCode() {
  return submitChange({ method: 'POST' }, '/invite-code')
}

/** Deja el store como al arrancar la app: se usa al cerrar sesión y en los test. */
function resetAccountStore() {
  pendingLoad = null
  setState(INITIAL_STATE)
}

/**
 * Expone la cuenta de la sesión y sus acciones de administración.
 *
 * @param {string | null} [accountId] Cuenta de la sesión, para saber si lo que
 * hay en el store todavía sirve.
 * @returns {object} Cuenta, estado de carga y acciones.
 */
function useAccount(accountId = null) {
  const snapshot = useSyncExternalStore(subscribe, getState)

  useEffect(() => {
    loadAccountOnce(accountId)
  }, [accountId])

  return { ...snapshot, renameAccount, rotateInviteCode }
}

export { getState, renameAccount, resetAccountStore, rotateInviteCode, useAccount }

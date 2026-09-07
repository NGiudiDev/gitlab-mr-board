// 2. Dependencias externas.
import { useCallback, useEffect, useState } from 'react'

// 7. Imports relativos restantes.
import config from '../../../config.js'

const NETWORK_ERROR_MESSAGE = 'No se pudo conectar al backend.'

/**
 * Llama a la API de administración de usuarios con la cookie de sesión.
 *
 * @param {string} path Ruta bajo `/api/users`.
 * @param {RequestInit} [options] Método y cuerpo de la petición.
 * @returns {Promise<Response>} Respuesta cruda.
 */
function requestUsers(path, options = {}) {
  const { body, ...rest } = options

  return fetch(`${config.apiBaseUrl}/api/users${path}`, {
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

/**
 * Administra la lista de usuarios de la pantalla de gestión.
 *
 * El estado es local a propósito: sólo lo consume esa pantalla, así que no
 * pertenece a un store compartido.
 *
 * @returns {object} Lista, estado de carga y acciones de administración.
 */
function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const response = await requestUsers('')

      if (!response.ok) {
        setError(await readErrorMessage(response))
        return
      }

      const body = await response.json()
      setUsers(body.users)
      setError(null)
    } catch {
      setError(NETWORK_ERROR_MESSAGE)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Ejecuta una acción de escritura y recarga la lista si salió bien.
   *
   * @param {string} path Ruta bajo `/api/users`.
   * @param {RequestInit} options Método y cuerpo de la petición.
   * @returns {Promise<string | null>} El mensaje de error, o `null` si se aplicó.
   */
  async function submit(path, options) {
    try {
      const response = await requestUsers(path, options)
      if (!response.ok) return await readErrorMessage(response)

      await load()
      return null
    } catch {
      return NETWORK_ERROR_MESSAGE
    }
  }

  return {
    users,
    loading,
    error,
    reload: load,
    createUser: (user) => submit('', { method: 'POST', body: user }),
    setStatus: (username, status) => submit(`/${username}/status`, { method: 'PATCH', body: { status } }),
    resetPassword: (username, password) => submit(`/${username}/password`, { method: 'PUT', body: { password } }),
  }
}

export { useUsers }

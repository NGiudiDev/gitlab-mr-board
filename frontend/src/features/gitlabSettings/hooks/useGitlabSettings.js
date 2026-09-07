// 2. Dependencias externas.
import { useCallback, useEffect, useState } from 'react'

// 7. Imports relativos restantes.
import config from '../../../config.js'

const NETWORK_ERROR_MESSAGE = 'No se pudo conectar al backend.'

/**
 * Llama a la API de configuración de GitLab con la cookie de sesión.
 *
 * @param {RequestInit & { body?: object }} [options] Método y cuerpo de la petición.
 * @returns {Promise<Response>} Respuesta cruda.
 */
function requestSettings(options = {}) {
  const { body, ...rest } = options

  return fetch(`${config.apiBaseUrl}/api/gitlab-settings`, {
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
 * Administra la configuración de GitLab de la propia cuenta.
 *
 * El estado es local: sólo lo consume la pantalla de cuenta, así que no
 * pertenece a un store compartido. El access token nunca llega al frontend;
 * el backend sólo devuelve sus últimos caracteres en `tokenHint`.
 *
 * @returns {object} Configuración guardada, estado de carga y el guardado.
 */
function useGitlabSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    try {
      const response = await requestSettings()

      if (!response.ok) {
        setError(await readErrorMessage(response))
        return
      }

      const body = await response.json()
      setSettings(body.settings)
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
   * Guarda los proyectos y, si se escribió uno nuevo, el access token.
   *
   * @param {{ projectIds: string, gitlabUsername: string, accessToken?: string }} input Datos del formulario.
   * @returns {Promise<string | null>} El mensaje de error, o `null` si se guardó.
   */
  async function save({ projectIds, gitlabUsername, accessToken }) {
    setSaving(true)

    try {
      const response = await requestSettings({
        method: 'PUT',
        // Sin token nuevo no se manda el campo: el backend conserva el guardado.
        body: accessToken
          ? { projectIds, gitlabUsername, accessToken }
          : { projectIds, gitlabUsername },
      })

      if (!response.ok) return await readErrorMessage(response)

      const body = await response.json()
      setSettings(body.settings)
      setError(null)
      return null
    } catch {
      return NETWORK_ERROR_MESSAGE
    } finally {
      setSaving(false)
    }
  }

  return { settings, loading, error, saving, reload: load, save }
}

export { useGitlabSettings }

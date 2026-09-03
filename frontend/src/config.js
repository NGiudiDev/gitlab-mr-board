const DEFAULT_API_BASE_URL = 'http://localhost:3001'

/**
 * Valida y normaliza la URL base usada para consultar el backend.
 *
 * @param {string | undefined} configuredUrl Valor recibido desde el entorno de Vite.
 * @returns {string} URL HTTP(S) sin barras finales.
 * @throws {Error} Si el valor configurado no es una URL HTTP(S) válida.
 */
function parseApiBaseUrl(configuredUrl) {
  const candidate = configuredUrl?.trim() || DEFAULT_API_BASE_URL

  let url
  try {
    url = new URL(candidate)
  } catch {
    throw new Error('VITE_API_BASE_URL debe ser una URL válida.')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_API_BASE_URL debe usar el protocolo http o https.')
  }

  return url.toString().replace(/\/$/, '')
}

const config = {
  apiBaseUrl: parseApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
}

export { DEFAULT_API_BASE_URL, parseApiBaseUrl }
export default config

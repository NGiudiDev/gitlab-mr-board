// 7. Imports relativos restantes.
import { resetSessionStore } from '../src/features/auth/hooks/useSession.js'
import { getState, resetStore } from '../src/features/mergeRequests/hooks/useMergeRequests.js'

/** Usuario con el que corren las pruebas que necesitan el tablero visible. */
const TEST_USER = {
  id: 'usuario-1',
  username: 'ana',
  displayName: 'Ana Pérez',
  role: 'user',
}

/**
 * Los stores mantienen un estado de módulo compartido por toda la app, así que
 * cada prueba debe dejarlos como al arrancar.
 */
function resetSharedState() {
  resetStore()
  resetSessionStore()
  return getState()
}

/**
 * Da por abierta la sesión, para las pruebas cuyo objeto es el tablero y no el
 * login. Evita que cada una tenga que simular `GET /api/auth/me`.
 *
 * @param {object} [user] Usuario de la sesión simulada.
 */
function signInTestUser(user = TEST_USER) {
  resetSessionStore({ user, status: 'authenticated' })
}

/** Respuesta exitosa de `fetch` con el cuerpo indicado. */
function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

export { jsonResponse, resetSharedState, signInTestUser, TEST_USER }

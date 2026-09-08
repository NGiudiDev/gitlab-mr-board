// 7. Imports relativos restantes.
import { resetAccountStore } from '../src/features/accounts/hooks/useAccount.js'
import { resetSessionStore } from '../src/features/auth/hooks/useSession.js'
import { getState, resetStore } from '../src/features/mergeRequests/hooks/useMergeRequests.js'

/** Cuenta a la que pertenece el usuario de prueba. */
const TEST_ACCOUNT = {
  id: 'cuenta-1',
  name: 'Equipo de prueba',
  createdAt: '2026-08-01T10:00:00.000Z',
  memberCount: 3,
  inviteCode: null,
}

/** Usuario con el que corren las pruebas que necesitan el tablero visible. */
const TEST_USER = {
  id: 'usuario-1',
  accountId: TEST_ACCOUNT.id,
  username: 'ana',
  displayName: 'Ana Pérez',
  role: 'user',
  gitlabUsername: 'ana-gitlab',
}

/**
 * Los stores mantienen un estado de módulo compartido por toda la app, así que
 * cada prueba debe dejarlos como al arrancar.
 */
function resetSharedState() {
  resetStore()
  resetSessionStore()
  resetAccountStore()
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

export { jsonResponse, resetSharedState, signInTestUser, TEST_ACCOUNT, TEST_USER }

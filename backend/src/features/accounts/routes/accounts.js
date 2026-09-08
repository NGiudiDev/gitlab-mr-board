// 2. Dependencias externas.
import express from 'express';

// 6. Imports relativos restantes.
import { respondWithHttpError } from '../../../shared/httpError.js';
import { createRequireAdmin, createRequireSession } from '../../auth/routes/auth.js';

/**
 * Crea el router de la cuenta a la que pertenece la sesión.
 *
 * Cualquier miembro puede ver de qué cuenta es parte; el código de invitación y
 * el cambio de nombre quedan para los administradores, porque el código alcanza
 * para que alguien más entre a ver el tablero.
 *
 * @param authService Servicio que valida la sesión y el rol.
 * @param accountService Servicio de cuentas ya construido.
 * @returns Router para montar bajo `/api/account`.
 */
function createAccountsRouter(authService, accountService) {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(authService);

  router.get('/', createRequireSession(authService), async (_request, response) => {
    const { accountId, role } = response.locals.user;

    try {
      response.json({ account: await accountService.getSummary(accountId, role === 'admin') });
    } catch (error) {
      respondWithHttpError(response, error, 'al leer la cuenta');
    }
  });

  router.patch('/', ...requireAdmin, async (request, response) => {
    const { accountId } = response.locals.user;
    const { name } = request.body ?? {};

    try {
      response.json({ account: await accountService.rename(accountId, name) });
    } catch (error) {
      respondWithHttpError(response, error, 'al renombrar la cuenta');
    }
  });

  router.post('/invite-code', ...requireAdmin, async (_request, response) => {
    const { accountId } = response.locals.user;

    try {
      response.json({ account: await accountService.rotateInviteCode(accountId) });
    } catch (error) {
      respondWithHttpError(response, error, 'al renovar el código de invitación');
    }
  });

  return router;
}

export { createAccountsRouter };

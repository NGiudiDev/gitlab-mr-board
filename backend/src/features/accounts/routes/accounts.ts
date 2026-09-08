// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService } from '../../auth/types.js';
import type { AccountService } from '../types.js';
import type { Router } from 'express';

// 7. Imports relativos restantes.
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
function createAccountsRouter(
  authService: AuthService,
  accountService: AccountService,
): Router {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(authService);

  router.get('/', createRequireSession(authService), async (_request, response) => {
    const { accountId, role } = response.locals.user as AuthenticatedUser;

    try {
      response.json({ account: await accountService.getSummary(accountId, role === 'admin') });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al leer la cuenta');
    }
  });

  router.patch('/', ...requireAdmin, async (request, response) => {
    const { accountId } = response.locals.user as AuthenticatedUser;
    const { name } = (request.body ?? {}) as { name?: unknown };

    try {
      response.json({ account: await accountService.rename(accountId, name) });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al renombrar la cuenta');
    }
  });

  router.post('/invite-code', ...requireAdmin, async (_request, response) => {
    const { accountId } = response.locals.user as AuthenticatedUser;

    try {
      response.json({ account: await accountService.rotateInviteCode(accountId) });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al renovar el código de invitación');
    }
  });

  return router;
}

export { createAccountsRouter };

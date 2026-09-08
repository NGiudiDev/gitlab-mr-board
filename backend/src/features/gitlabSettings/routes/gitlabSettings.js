// 2. Dependencias externas.
import express from 'express';

// 6. Imports relativos restantes.
import { respondWithHttpError } from '../../../shared/httpError.js';
import { createRequireAdmin, createRequireSession } from '../../auth/routes/auth.js';

/**
 * Crea el router de la configuración de GitLab de la cuenta.
 *
 * Cualquier miembro puede leerla —necesita saber si el tablero ya tiene de
 * dónde alimentarse—, pero sólo un administrador la carga o la borra: el token
 * y los proyectos son compartidos, así que un cambio afecta a todo el equipo.
 *
 * El access token nunca vuelve al navegador: las respuestas sólo describen
 * cuál está guardado mediante sus últimos caracteres.
 *
 * @param authService Servicio que valida la sesión y el rol.
 * @param gitlabSettingsService Servicio de configuración ya construido.
 * @returns Router para montar bajo `/api/gitlab-settings`.
 */
function createGitLabSettingsRouter(authService, gitlabSettingsService) {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(authService);

  router.get('/', createRequireSession(authService), async (_request, response) => {
    const { accountId } = response.locals.user;

    try {
      response.json({ settings: await gitlabSettingsService.getSummary(accountId) });
    } catch (error) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  router.put('/', ...requireAdmin, async (request, response) => {
    const { accountId } = response.locals.user;
    const { projectIds, accessToken } = request.body ?? {};

    try {
      const settings = await gitlabSettingsService.save(accountId, {
        projectIds,
        ...(accessToken === undefined ? {} : { accessToken }),
      });

      response.json({ settings });
    } catch (error) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  router.delete('/', ...requireAdmin, async (_request, response) => {
    const { accountId } = response.locals.user;

    try {
      await gitlabSettingsService.remove(accountId);
      response.status(204).end();
    } catch (error) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  return router;
}

export { createGitLabSettingsRouter };

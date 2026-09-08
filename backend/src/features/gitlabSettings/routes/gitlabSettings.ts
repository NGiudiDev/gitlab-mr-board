// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService } from '../../auth/types.js';
import type { GitLabSettingsService } from '../types.js';
import type { Router } from 'express';

// 7. Imports relativos restantes.
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
function createGitLabSettingsRouter(
  authService: AuthService,
  gitlabSettingsService: GitLabSettingsService,
): Router {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(authService);

  router.get('/', createRequireSession(authService), async (_request, response) => {
    const { accountId } = response.locals.user as AuthenticatedUser;

    try {
      response.json({ settings: await gitlabSettingsService.getSummary(accountId) });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  router.put('/', ...requireAdmin, async (request, response) => {
    const { accountId } = response.locals.user as AuthenticatedUser;
    const { projectIds, accessToken } = (request.body ?? {}) as {
      projectIds?: unknown;
      accessToken?: string;
    };

    try {
      const settings = await gitlabSettingsService.save(accountId, {
        projectIds,
        ...(accessToken === undefined ? {} : { accessToken }),
      });

      response.json({ settings });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  router.delete('/', ...requireAdmin, async (_request, response) => {
    const { accountId } = response.locals.user as AuthenticatedUser;

    try {
      await gitlabSettingsService.remove(accountId);
      response.status(204).end();
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  return router;
}

export { createGitLabSettingsRouter };

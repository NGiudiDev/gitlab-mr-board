// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService } from '../../auth/types.js';
import type { GitLabSettingsService } from '../types.js';
import type { Router } from 'express';

// 7. Imports relativos restantes.
import { respondWithHttpError } from '../../../shared/httpError.js';
import { createRequireSession } from '../../auth/routes/auth.js';

/**
 * Crea el router de la configuración de GitLab de la propia cuenta.
 *
 * El access token nunca vuelve al navegador: las respuestas sólo describen
 * cuál está guardado mediante sus últimos caracteres.
 *
 * @param authService Servicio que valida la sesión.
 * @param gitlabSettingsService Servicio de configuración ya construido.
 * @returns Router para montar bajo `/api/gitlab-settings`.
 */
function createGitLabSettingsRouter(
  authService: AuthService,
  gitlabSettingsService: GitLabSettingsService,
): Router {
  const router = express.Router();

  router.use(createRequireSession(authService));

  router.get('/', async (_request, response) => {
    const { id } = response.locals.user as AuthenticatedUser;

    try {
      response.json({ settings: await gitlabSettingsService.getSummary(id) });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  router.put('/', async (request, response) => {
    const { id } = response.locals.user as AuthenticatedUser;
    const { projectIds, gitlabUsername, accessToken } = (request.body ?? {}) as {
      projectIds?: unknown;
      gitlabUsername?: unknown;
      accessToken?: string;
    };

    try {
      const settings = await gitlabSettingsService.save(id, {
        projectIds,
        gitlabUsername,
        ...(accessToken === undefined ? {} : { accessToken }),
      });

      response.json({ settings });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  router.delete('/', async (_request, response) => {
    const { id } = response.locals.user as AuthenticatedUser;

    try {
      await gitlabSettingsService.remove(id);
      response.status(204).end();
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'en la configuración de GitLab');
    }
  });

  return router;
}

export { createGitLabSettingsRouter };

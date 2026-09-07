// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService, GitLabSettingsService } from '../types.js';
import type { Response, Router } from 'express';

// 7. Imports relativos restantes.
import { GitLabSettingsError } from '../services/gitlabSettingsService.js';
import { createRequireSession } from './auth.js';

/**
 * Traduce un fallo de configuración a una respuesta HTTP.
 *
 * @param response Respuesta de Express en curso.
 * @param error Error capturado; sólo los `GitLabSettingsError` conservan su código.
 */
function respondWithSettingsError(response: Response, error: unknown): void {
  if (error instanceof GitLabSettingsError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  console.error('Error inesperado al guardar la configuración de GitLab:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
}

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

  router.get('/', (_request, response) => {
    const { id } = response.locals.user as AuthenticatedUser;

    response.json({ settings: gitlabSettingsService.getSummary(id) });
  });

  router.put('/', (request, response) => {
    const { id } = response.locals.user as AuthenticatedUser;
    const { projectIds, accessToken } = (request.body ?? {}) as {
      projectIds?: unknown;
      accessToken?: string;
    };

    try {
      const settings = gitlabSettingsService.save(id, {
        projectIds,
        ...(accessToken === undefined ? {} : { accessToken }),
      });

      response.json({ settings });
    } catch (error: unknown) {
      respondWithSettingsError(response, error);
    }
  });

  router.delete('/', (_request, response) => {
    const { id } = response.locals.user as AuthenticatedUser;

    gitlabSettingsService.remove(id);
    response.status(204).end();
  });

  return router;
}

export { createGitLabSettingsRouter };

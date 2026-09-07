// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type {
  AuthenticatedUser,
  GitLabCredentials,
  MergeRequestResponse,
  MergeRequestsRouterOptions,
} from '../types.js';
import type { Router } from 'express';

// 7. Imports relativos restantes.
import config from '../config.js';
import { getAllMergeRequests } from '../services/mergeRequestService.js';

/** Respuesta guardada para una configuración concreta de una persona. */
interface CacheEntry {
  /** Identifica la versión de la configuración con la que se consultó. */
  settingsVersion: string;
  data: MergeRequestResponse;
  storedAt: number;
}

/**
 * Crea el router con una caché aislada y dependencias reemplazables para los
 * test de integración.
 *
 * Cada persona consulta GitLab con su propio token, así que la caché es por
 * usuario: compartirla filtraría entre cuentas proyectos que no configuraron.
 */
export function createMergeRequestsRouter(params: MergeRequestsRouterOptions): Router {
  const {
    fetchMergeRequests = getAllMergeRequests,
    gitlabSettingsService,
    now = () => Date.now()
  } = params;

  const router = express.Router();
  const cacheByUserId = new Map<string, CacheEntry>();

  /**
   * Devuelve la respuesta reutilizable mientras siga dentro del TTL y
   * corresponda a la configuración vigente.
   *
   * Guardar la fecha de la configuración evita tener que avisarle a este
   * router cuando alguien cambia sus proyectos o su token.
   */
  function getFreshCache(userId: string, credentials: GitLabCredentials): MergeRequestResponse | null {
    const entry = cacheByUserId.get(userId);

    if (!entry) return null;
    if (entry.settingsVersion !== credentials.updatedAt) return null;
    if (now() - entry.storedAt >= config.cacheTtlMs) return null;

    return entry.data;
  }

  /** Reemplaza la caché solo después de completar una consulta satisfactoria. */
  function storeInCache(userId: string, credentials: GitLabCredentials, data: MergeRequestResponse): void {
    cacheByUserId.set(userId, {
      settingsVersion: credentials.updatedAt,
      data,
      storedAt: now(),
    });
  }

  router.get('/pull-requests', async (request, response) => {
    const { id: userId } = response.locals.user as AuthenticatedUser;
    const credentials = gitlabSettingsService.getCredentials(userId);

    if (!credentials) {
      response.status(409).json({
        error: 'Configurá tus datos de GitLab en «Mi cuenta» para ver el tablero.',
        code: 'gitlab_settings_missing',
      });
      return;
    }

    const forceRefresh = request.query.force === 'true';
    const freshCache = forceRefresh ? null : getFreshCache(userId, credentials);

    if (freshCache) {
      response.json(freshCache);
      return;
    }

    try {
      const data = await fetchMergeRequests(credentials);
      storeInCache(userId, credentials, data);
      response.json(data);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);

      console.error('Error al obtener los merge requests:', error);
      response.status(502).json({ error: 'No se pudieron obtener los merge requests de GitLab.', detail });
    }
  });

  return router;
}

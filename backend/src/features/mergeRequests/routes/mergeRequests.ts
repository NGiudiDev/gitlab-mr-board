// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser } from '../../auth/types.js';
import type { GitLabCredentials, GitLabSettingsService } from '../../gitlabSettings/types.js';
import type { MergeRequestResponse, MergeRequestsDependencies } from '../types.js';
import type { Router } from 'express';

// 7. Imports relativos restantes.
import config from '../../../config.js';
import { getAllMergeRequests } from '../services/mergeRequestService.js';

interface MergeRequestsRouterOptions extends MergeRequestsDependencies {
  /** Origen de las credenciales con las que se consulta GitLab. */
  gitlabSettingsService: GitLabSettingsService;
}

/** Respuesta guardada para una configuración concreta de una cuenta. */
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
 * La caché es **por cuenta**: sus miembros consultan GitLab con las mismas
 * credenciales, así que comparten la respuesta y el equipo entero cuesta una
 * sola consulta. Lo único propio de cada persona es con qué nickname se
 * reconoce en el tablero, y eso se completa al responder.
 */
export function createMergeRequestsRouter(params: MergeRequestsRouterOptions): Router {
  const {
    fetchMergeRequests = getAllMergeRequests,
    gitlabSettingsService,
    now = () => Date.now()
  } = params;

  const router = express.Router();
  const cacheByAccountId = new Map<string, CacheEntry>();

  /**
   * Devuelve la respuesta reutilizable mientras siga dentro del TTL y
   * corresponda a la configuración vigente.
   *
   * Guardar la fecha de la configuración evita tener que avisarle a este
   * router cuando alguien cambia los proyectos o el token de la cuenta.
   */
  function getFreshCache(accountId: string, credentials: GitLabCredentials): MergeRequestResponse | null {
    const entry = cacheByAccountId.get(accountId);

    if (!entry) return null;
    if (entry.settingsVersion !== credentials.updatedAt) return null;
    if (now() - entry.storedAt >= config.cacheTtlMs) return null;

    return entry.data;
  }

  /** Reemplaza la caché solo después de completar una consulta satisfactoria. */
  function storeInCache(accountId: string, credentials: GitLabCredentials, data: MergeRequestResponse): void {
    cacheByAccountId.set(accountId, {
      settingsVersion: credentials.updatedAt,
      data,
      storedAt: now(),
    });
  }

  /**
   * Marca en la respuesta con qué nickname de GitLab se reconoce quien pregunta.
   *
   * La respuesta guardada es de la cuenta, así que la identidad del lector se
   * aplica recién al entregarla: dos personas de la misma cuenta reciben los
   * mismos merge requests con distinto `viewerUsername`.
   */
  function withViewer(data: MergeRequestResponse, viewerUsername: string | null): MergeRequestResponse {
    return { ...data, meta: { ...data.meta, viewerUsername } };
  }

  router.get('/pull-requests', async (request, response) => {
    const { accountId, gitlabUsername } = response.locals.user as AuthenticatedUser;

    // La configuración vive en una base remota: si no se puede leer, el
    // problema es de la base y no de GitLab ni de la configuración.
    let credentials: GitLabCredentials | null;

    try {
      credentials = await gitlabSettingsService.getCredentials(accountId);
    } catch (error: unknown) {
      console.error('Error al leer la configuración de GitLab:', error);
      response.status(503).json({ error: 'No se pudo leer la configuración de GitLab de tu cuenta.' });
      return;
    }

    if (!credentials) {
      response.status(409).json({
        error: 'Todavía no hay datos de GitLab configurados en esta cuenta.',
        code: 'gitlab_settings_missing',
      });
      return;
    }

    const forceRefresh = request.query.force === 'true';
    const freshCache = forceRefresh ? null : getFreshCache(accountId, credentials);

    if (freshCache) {
      response.json(withViewer(freshCache, gitlabUsername));
      return;
    }

    try {
      const data = await fetchMergeRequests(credentials);
      storeInCache(accountId, credentials, data);
      response.json(withViewer(data, gitlabUsername));
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);

      console.error('Error al obtener los merge requests:', error);
      response.status(502).json({ error: 'No se pudieron obtener los merge requests de GitLab.', detail });
    }
  });

  return router;
}

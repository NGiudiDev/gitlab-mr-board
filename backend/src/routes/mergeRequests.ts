import express, { type Router } from 'express';
import config from '../config.js';
import { getAllMergeRequests } from '../services/mergeRequestService.js';
import type { MergeRequestResponse, MergeRequestsRouterOptions } from '../types.js';

/**
 * Crea el router con una caché aislada y dependencias reemplazables para los
 * test de integración.
 */
export function createMergeRequestsRouter({
  fetchMergeRequests = getAllMergeRequests,
  now = () => Date.now(),
}: MergeRequestsRouterOptions = {}): Router {
  const router = express.Router();
  let cache: MergeRequestResponse | null = null;
  let cacheTimestamp = 0;

  /** Devuelve la respuesta reutilizable mientras siga dentro del TTL. */
  function getFreshCache(): MergeRequestResponse | null {
    if (!cache) return null;
    if (now() - cacheTimestamp >= config.cacheTtlMs) return null;

    return cache;
  }

  /** Reemplaza la caché solo después de completar una consulta satisfactoria. */
  function storeInCache(data: MergeRequestResponse): void {
    cache = data;
    cacheTimestamp = now();
  }

  router.get('/pull-requests', async (request, response) => {
    const forceRefresh = request.query.force === 'true';
    const freshCache = forceRefresh ? null : getFreshCache();

    if (freshCache) {
      response.json(freshCache);
      return;
    }

    try {
      const data = await fetchMergeRequests();
      storeInCache(data);
      response.json(data);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);

      console.error('Error al obtener los merge requests:', error);
      response.status(502).json({ error: 'No se pudieron obtener los merge requests de GitLab.', detail });
    }
  });

  return router;
}

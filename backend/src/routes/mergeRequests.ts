import express, { type Router } from 'express';
import config from '../config.js';
import { getAllMergeRequests } from '../services/mergeRequestService.js';
import type { MergeRequestResponse } from '../types.js';

interface MergeRequestsRouterOptions {
  /** Fuente de datos; inyectable para no depender de GitLab en las pruebas. */
  fetchMergeRequests?: () => Promise<MergeRequestResponse>;
  /** Reloj de la caché; inyectable para controlar el vencimiento del TTL. */
  now?: () => number;
}

function createMergeRequestsRouter({
  fetchMergeRequests = getAllMergeRequests,
  now = () => Date.now(),
}: MergeRequestsRouterOptions = {}): Router {
  const router = express.Router();
  let cache: MergeRequestResponse | null = null;
  let cacheTimestamp = 0;

  router.get('/pull-requests', async (request, response) => {
    const force = request.query.force === 'true';
    if (!force && cache && now() - cacheTimestamp < config.cacheTtlMs) {
      response.json(cache);
      return;
    }

    try {
      const data = await fetchMergeRequests();
      cache = data;
      cacheTimestamp = now();
      response.json(data);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('Error al obtener los merge requests:', error);
      response.status(502).json({ error: 'No se pudieron obtener los merge requests de GitLab.', detail });
    }
  });

  return router;
}

export { createMergeRequestsRouter };

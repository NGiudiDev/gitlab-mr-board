import express from 'express';
import config from '../config.js';
import { getAllMergeRequests } from '../services/mergeRequestService.js';
import type { MergeRequestResponse } from '../types.js';

const router = express.Router();
let cache: MergeRequestResponse | null = null;
let cacheTimestamp = 0;

router.get('/pull-requests', async (request, response) => {
  const force = request.query.force === 'true';
  if (!force && cache && Date.now() - cacheTimestamp < config.cacheTtlMs) {
    response.json(cache);
    return;
  }

  try {
    const data = await getAllMergeRequests();
    cache = data;
    cacheTimestamp = Date.now();
    response.json(data);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Error al obtener los merge requests:', error);
    response.status(502).json({ error: 'No se pudieron obtener los merge requests de GitLab.', detail });
  }
});

export default router;

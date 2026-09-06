// 2. Dependencias externas.
import cors from 'cors';
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { CreateAppOptions } from './types.js';
import type { ErrorRequestHandler, Express } from 'express';

// 7. Imports relativos restantes.
import config from './config.js';
import { createMergeRequestsRouter } from './routes/mergeRequests.js';

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

/** Convierte cualquier error no controlado en una respuesta HTTP segura. */
const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error('Error no controlado:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
};

/**
 * Construye la aplicación Express sin escuchar en un puerto, para que los
 * test de integración la ejecuten en memoria.
 */
function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(cors({ origin: ALLOWED_ORIGINS }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', projects: config.projectIds.length });
  });

  app.use('/api', createMergeRequestsRouter(options));
  app.use(errorHandler);

  return app;
}

export { createApp };

import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import config from './config.js';
import { createMergeRequestsRouter } from './routes/mergeRequests.js';
import type { CreateAppOptions } from './types.js';

/**
 * Construye la aplicación Express sin escuchar en un puerto, para que las
 * pruebas de integración la ejecuten en memoria.
 */
function createApp(options: CreateAppOptions = {}): Express {
  const app = express();

  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', projects: config.projectIds.length });
  });

  app.use('/api', createMergeRequestsRouter(options));

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    console.error('Error no controlado:', error);
    response.status(500).json({ error: 'Error interno del servidor.' });
  };

  app.use(errorHandler);

  return app;
}

export { createApp };

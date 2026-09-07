// 2. Dependencias externas.
import cors from 'cors';
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthService, CreateAppOptions } from './types.js';
import type { ErrorRequestHandler, Express } from 'express';

// 7. Imports relativos restantes.
import config from './config.js';
import { createAuthRouter, createRequireSession } from './routes/auth.js';
import { createMergeRequestsRouter } from './routes/mergeRequests.js';
import { createUsersRouter } from './routes/users.js';
import { openAuthDatabase } from './services/authRepository.js';
import { createAuthService } from './services/authService.js';

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

/** Convierte cualquier error no controlado en una respuesta HTTP segura. */
const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error('Error no controlado:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
};

/** Abre la base SQLite configurada y arma el servicio de autenticación. */
function createConfiguredAuthService(): AuthService {
  return createAuthService({
    repository: openAuthDatabase(config.databasePath),
    sessionDurationDays: config.sessionDurationDays,
  });
}

/**
 * Construye la aplicación Express sin escuchar en un puerto, para que los
 * test de integración la ejecuten en memoria.
 */
function createApp(options: CreateAppOptions = {}): Express {
  const { authService = createConfiguredAuthService() } = options;
  const app = express();

  // `credentials` es lo que permite que el navegador mande la cookie de sesión
  // al backend, que corre en otro puerto durante el desarrollo.
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', projects: config.projectIds.length });
  });

  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/users', createUsersRouter(authService));
  app.use('/api', createRequireSession(authService), createMergeRequestsRouter(options));
  app.use(errorHandler);

  return app;
}

export { createApp };

// 2. Dependencias externas.
import cors from 'cors';
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthService, CreateAppOptions, Database, GitLabSettingsService } from './types.js';
import type { ErrorRequestHandler, Express } from 'express';

// 6. Utilidades.
import { createSecretCipher } from './utils/encryption.js';

// 7. Imports relativos restantes.
import config from './config.js';
import { createAuthRouter, createRequireSession } from './routes/auth.js';
import { createGitLabSettingsRouter } from './routes/gitlabSettings.js';
import { createMergeRequestsRouter } from './routes/mergeRequests.js';
import { createUsersRouter } from './routes/users.js';
import { createAuthRepository } from './services/authRepository.js';
import { createAuthService } from './services/authService.js';
import { createNeonDatabase } from './services/database.js';
import { createGitLabSettingsRepository } from './services/gitlabSettingsRepository.js';
import { createGitLabSettingsService } from './services/gitlabSettingsService.js';

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

/** Convierte cualquier error no controlado en una respuesta HTTP segura. */
const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error('Error no controlado:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
};

/**
 * Arma sobre una base ya abierta los dos servicios que necesita la aplicación.
 *
 * Comparten la conexión: las claves foráneas entre sus tablas sólo valen dentro
 * de la misma base, y un pool por servicio duplicaría las conexiones contra
 * Neon sin ningún beneficio.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en
 * memoria para los test.
 * @returns Servicio de autenticación y de configuración de GitLab.
 */
function createServices(database: Database): {
  authService: AuthService;
  gitlabSettingsService: GitLabSettingsService;
} {
  return {
    authService: createAuthService({
      repository: createAuthRepository(database),
      sessionDurationDays: config.sessionDurationDays,
    }),
    gitlabSettingsService: createGitLabSettingsService({
      repository: createGitLabSettingsRepository(database),
      cipher: createSecretCipher(config.encryptionKey),
    }),
  };
}

/**
 * Completa con la base configurada los servicios que no vinieron inyectados.
 *
 * El pool de Neon es perezoso, así que construirlo no abre ninguna conexión: un
 * test que inyecta los dos servicios nunca toca la red.
 *
 * @param options Servicios ya construidos, si los hay.
 * @returns Los dos servicios que necesita la aplicación.
 */
function resolveServices(options: CreateAppOptions): {
  authService: AuthService;
  gitlabSettingsService: GitLabSettingsService;
} {
  if (options.authService && options.gitlabSettingsService) {
    return {
      authService: options.authService,
      gitlabSettingsService: options.gitlabSettingsService,
    };
  }

  const configured = createServices(createNeonDatabase(config.databaseUrl));

  return {
    authService: options.authService ?? configured.authService,
    gitlabSettingsService: options.gitlabSettingsService ?? configured.gitlabSettingsService,
  };
}

/**
 * Construye la aplicación Express sin escuchar en un puerto, para que los
 * test de integración la ejecuten en memoria.
 */
function createApp(options: CreateAppOptions = {}): Express {
  const { authService, gitlabSettingsService } = resolveServices(options);
  const app = express();

  // `credentials` es lo que permite que el navegador mande la cookie de sesión
  // al backend, que corre en otro puerto durante el desarrollo.
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/users', createUsersRouter(authService));
  app.use('/api/gitlab-settings', createGitLabSettingsRouter(authService, gitlabSettingsService));
  app.use('/api', createRequireSession(authService), createMergeRequestsRouter({ ...options, gitlabSettingsService }));

  app.use(errorHandler);

  return app;
}

export { createApp, createServices };

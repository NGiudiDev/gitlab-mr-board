// 2. Dependencias externas.
import cors from 'cors';
import express from 'express';

// 5. Utilidades.
import { createSecretCipher } from './features/gitlabSettings/utils/encryption.js';

// 6. Imports relativos restantes.
import config from './config.js';
import { createAccountsRouter } from './features/accounts/routes/accounts.js';
import { createAccountRepository } from './features/accounts/services/accountRepository.js';
import { createAccountService } from './features/accounts/services/accountService.js';
import { createAuthRouter, createRequireSession } from './features/auth/routes/auth.js';
import { createUsersRouter } from './features/auth/routes/users.js';
import { createAuthRepository } from './features/auth/services/authRepository.js';
import { createAuthService } from './features/auth/services/authService.js';
import { createGitLabSettingsRouter } from './features/gitlabSettings/routes/gitlabSettings.js';
import { createGitLabSettingsRepository } from './features/gitlabSettings/services/gitlabSettingsRepository.js';
import { createGitLabSettingsService } from './features/gitlabSettings/services/gitlabSettingsService.js';
import { createMergeRequestsRouter } from './features/mergeRequests/routes/mergeRequests.js';
import { createNeonDatabase } from './shared/database.js';

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

/** Convierte cualquier error no controlado en una respuesta HTTP segura. */
const errorHandler = (error, _request, response, _next) => {
  console.error('Error no controlado:', error);
  response.status(500).json({ error: 'Error interno del servidor.' });
};

/**
 * Arma sobre una base ya abierta los servicios que necesita la aplicación.
 *
 * Comparten la conexión: las claves foráneas entre sus tablas sólo valen dentro
 * de la misma base, y un pool por servicio duplicaría las conexiones contra
 * Neon sin ningún beneficio.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en
 * memoria para los test.
 * @returns Servicios de cuentas, de autenticación y de configuración de GitLab.
 */
function createServices(database) {
  const accountService = createAccountService({
    repository: createAccountRepository(database),
  });

  return {
    accountService,
    authService: createAuthService({
      repository: createAuthRepository(database),
      accountService,
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
 * test que inyecta todos los servicios nunca toca la red.
 *
 * @param options Servicios ya construidos, si los hay.
 * @returns Los servicios que necesita la aplicación.
 */
function resolveServices(options) {
  const { accountService, authService, gitlabSettingsService } = options;

  if (accountService && authService && gitlabSettingsService) {
    return { accountService, authService, gitlabSettingsService };
  }

  const configured = createServices(createNeonDatabase(config.databaseUrl));

  return {
    accountService: accountService ?? configured.accountService,
    authService: authService ?? configured.authService,
    gitlabSettingsService: gitlabSettingsService ?? configured.gitlabSettingsService,
  };
}

/**
 * Construye la aplicación Express sin escuchar en un puerto, para que los
 * test de integración la ejecuten en memoria.
 */
function createApp(options = {}) {
  const { fetchMergeRequests, now } = options;
  const { accountService, authService, gitlabSettingsService } = resolveServices(options);
  const app = express();

  // `credentials` es lo que permite que el navegador mande la cookie de sesión
  // al backend, que corre en otro puerto durante el desarrollo.
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/account', createAccountsRouter(authService, accountService));
  app.use('/api/users', createUsersRouter(authService));
  app.use('/api/gitlab-settings', createGitLabSettingsRouter(authService, gitlabSettingsService));
  app.use(
    '/api',
    createRequireSession(authService),
    createMergeRequestsRouter({ fetchMergeRequests, now, gitlabSettingsService }),
  );
  app.use(errorHandler);

  return app;
}

export { createApp, createServices };

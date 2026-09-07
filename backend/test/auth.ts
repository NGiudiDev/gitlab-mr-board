// 4. Imports exclusivos de tipos de TypeScript.
import type { CreateAppOptions } from '../src/app.js';
import type { AuthRepository, AuthService, UserRole } from '../src/features/auth/types.js';
import type { GitLabSettingsService } from '../src/features/gitlabSettings/types.js';
import type { Database } from '../src/shared/types.js';
import type { AuthenticatedTestApp } from './types.js';

// 5. Módulos de constantes.
import { TEST_DISPLAY_NAME, TEST_ENCRYPTION_KEY, TEST_PASSWORD, TEST_PROJECT_IDS, TEST_TOKEN, TEST_USERNAME } from './constants.js';

// 6. Utilidades.
import { createSecretCipher } from '../src/features/gitlabSettings/utils/encryption.js';

// 7. Imports relativos restantes.
import { createApp } from '../src/app.js';
import { SESSION_COOKIE_NAME } from '../src/features/auth/routes/auth.js';
import { createAuthRepository } from '../src/features/auth/services/authRepository.js';
import { createAuthService } from '../src/features/auth/services/authService.js';
import { createGitLabSettingsRepository } from '../src/features/gitlabSettings/services/gitlabSettingsRepository.js';
import { createGitLabSettingsService } from '../src/features/gitlabSettings/services/gitlabSettingsService.js';
import { createTestDatabase } from './database.js';

/** Abre un repositorio de autenticación en memoria, aislado por test. */
async function createTestRepository(): Promise<AuthRepository> {
  return createAuthRepository(await createTestDatabase());
}

/** Crea un servicio de autenticación sobre una base vacía. */
async function createEmptyAuthService(): Promise<AuthService> {
  return createAuthService({ repository: await createTestRepository() });
}

/**
 * Crea el servicio de configuración de GitLab sobre una base ya abierta.
 *
 * @param database Base compartida con el servicio de autenticación.
 * @returns Servicio listo para guardar y leer configuraciones.
 */
function createTestGitLabSettingsService(database: Database): GitLabSettingsService {
  return createGitLabSettingsService({
    repository: createGitLabSettingsRepository(database),
    cipher: createSecretCipher(TEST_ENCRYPTION_KEY),
  });
}

/**
 * Crea un servicio de autenticación con un usuario de prueba ya dado de alta.
 *
 * @param role Rol del usuario de prueba; `admin` para las rutas de gestión.
 * @returns Servicio listo para iniciar sesión con `TEST_USERNAME`.
 */
async function createTestAuthService(role: UserRole = 'user'): Promise<AuthService> {
  const authService = await createEmptyAuthService();

  await authService.createUser({
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    displayName: TEST_DISPLAY_NAME,
    role,
  });

  return authService;
}

/**
 * Levanta la app con una sesión iniciada, para los test de rutas protegidas.
 *
 * El usuario de prueba arranca con su configuración de GitLab ya guardada: sin
 * ella el tablero responde 409, y casi todos los test la dan por hecha. Para
 * probar el caso contrario alcanza con `gitlabSettingsService.remove(user.id)`.
 *
 * @param options Dependencias del tablero que el test quiera reemplazar.
 * @param role Rol del usuario de la sesión.
 * @returns App, servicios, usuario y la cookie de sesión a reenviar.
 */
async function createAuthenticatedApp(
  options: CreateAppOptions = {},
  role: UserRole = 'user',
): Promise<AuthenticatedTestApp> {
  // Ambos repositorios comparten la conexión: la clave foránea de
  // `gitlab_settings` exige que el usuario viva en la misma base.
  const database = await createTestDatabase();
  const authService = createAuthService({ repository: createAuthRepository(database) });
  const gitlabSettingsService = createTestGitLabSettingsService(database);

  await authService.createUser({
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    displayName: TEST_DISPLAY_NAME,
    role,
  });

  const { user, token } = await authService.login({
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
  });

  await gitlabSettingsService.save(user.id, {
    projectIds: TEST_PROJECT_IDS,
    accessToken: TEST_TOKEN,
  });

  return {
    app: createApp({ ...options, authService, gitlabSettingsService }),
    authService,
    gitlabSettingsService,
    user,
    cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

export {
  createAuthenticatedApp,
  createEmptyAuthService,
  createTestAuthService,
  createTestDatabase,
  createTestGitLabSettingsService,
  createTestRepository,
};

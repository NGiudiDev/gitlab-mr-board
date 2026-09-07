// 4. Imports exclusivos de tipos de TypeScript.
import type {
  AuthenticatedTestApp,
  AuthRepository,
  AuthService,
  CreateAppOptions,
  UserRole,
} from '../src/types.js';

// 5. Módulos de constantes.
import { TEST_DISPLAY_NAME, TEST_PASSWORD, TEST_USERNAME } from './constants.js';

// 7. Imports relativos restantes.
import { createApp } from '../src/app.js';
import { SESSION_COOKIE_NAME } from '../src/routes/auth.js';
import { IN_MEMORY_LOCATION, openAuthDatabase } from '../src/services/authRepository.js';
import { createAuthService } from '../src/services/authService.js';

/** Abre un repositorio en memoria, aislado por test. */
function createTestRepository(): AuthRepository {
  return openAuthDatabase(IN_MEMORY_LOCATION);
}

/** Crea un servicio sobre una base vacía, para los test de registro. */
function createEmptyAuthService(): AuthService {
  return createAuthService({ repository: createTestRepository() });
}

/**
 * Crea un servicio de autenticación con un usuario de prueba ya dado de alta.
 *
 * @param role Rol del usuario de prueba; `admin` para las rutas de gestión.
 * @returns Servicio listo para iniciar sesión con `TEST_USERNAME`.
 */
async function createTestAuthService(role: UserRole = 'user'): Promise<AuthService> {
  const authService = createEmptyAuthService();

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
 * @param options Dependencias del tablero que el test quiera reemplazar.
 * @param role Rol del usuario de la sesión.
 * @returns App, servicio y la cookie de sesión a reenviar.
 */
async function createAuthenticatedApp(
  options: CreateAppOptions = {},
  role: UserRole = 'user',
): Promise<AuthenticatedTestApp> {
  const authService = await createTestAuthService(role);
  const { token } = await authService.login({ username: TEST_USERNAME, password: TEST_PASSWORD });

  return {
    app: createApp({ ...options, authService }),
    authService,
    cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

export {
  createAuthenticatedApp,
  createEmptyAuthService,
  createTestAuthService,
  createTestRepository,
};

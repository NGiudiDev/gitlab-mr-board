// 4. Imports exclusivos de tipos de TypeScript.
import type { CreateAppOptions } from '../src/app.js';
import type { AccountService, StoredAccount } from '../src/features/accounts/types.js';
import type { AuthRepository, AuthService, UserRole } from '../src/features/auth/types.js';
import type { GitLabSettingsService } from '../src/features/gitlabSettings/types.js';
import type { Database } from '../src/shared/types.js';
import type { AuthenticatedTestApp } from './types.js';

// 5. Módulos de constantes.
import { TEST_ACCOUNT_NAME, TEST_DISPLAY_NAME, TEST_ENCRYPTION_KEY, TEST_GITLAB_USERNAME, TEST_PASSWORD, TEST_PROJECT_IDS, TEST_TOKEN, TEST_USERNAME } from './constants.js';

// 6. Utilidades.
import { createSecretCipher } from '../src/features/gitlabSettings/utils/encryption.js';

// 7. Imports relativos restantes.
import { createApp } from '../src/app.js';
import { createAccountRepository } from '../src/features/accounts/services/accountRepository.js';
import { createAccountService } from '../src/features/accounts/services/accountService.js';
import { SESSION_COOKIE_NAME } from '../src/features/auth/routes/auth.js';
import { createAuthRepository } from '../src/features/auth/services/authRepository.js';
import { createAuthService } from '../src/features/auth/services/authService.js';
import { createGitLabSettingsRepository } from '../src/features/gitlabSettings/services/gitlabSettingsRepository.js';
import { createGitLabSettingsService } from '../src/features/gitlabSettings/services/gitlabSettingsService.js';
import { createTestDatabase } from './database.js';

/** Los servicios de una base de test, armados como en producción. */
interface TestServices {
  accountService: AccountService;
  authService: AuthService;
  gitlabSettingsService: GitLabSettingsService;
}

/** Abre un repositorio de autenticación en memoria, aislado por test. */
async function createTestRepository(): Promise<AuthRepository> {
  return createAuthRepository(await createTestDatabase());
}

/** Crea el servicio de cuentas sobre una base ya abierta. */
function createTestAccountService(database: Database): AccountService {
  return createAccountService({ repository: createAccountRepository(database) });
}

/**
 * Crea el servicio de configuración de GitLab sobre una base ya abierta.
 *
 * @param database Base compartida con el resto de los servicios.
 * @returns Servicio listo para guardar y leer configuraciones.
 */
function createTestGitLabSettingsService(database: Database): GitLabSettingsService {
  return createGitLabSettingsService({
    repository: createGitLabSettingsRepository(database),
    cipher: createSecretCipher(TEST_ENCRYPTION_KEY),
  });
}

/**
 * Arma los tres servicios sobre una misma base en memoria.
 *
 * Comparten la conexión porque las claves foráneas entre sus tablas sólo valen
 * dentro de la misma base.
 *
 * @param database Base con el esquema ya aplicado.
 * @returns Servicios de cuentas, autenticación y configuración de GitLab.
 */
function createTestServices(database: Database): TestServices {
  const accountService = createTestAccountService(database);

  return {
    accountService,
    authService: createAuthService({
      repository: createAuthRepository(database),
      accountService,
    }),
    gitlabSettingsService: createTestGitLabSettingsService(database),
  };
}

/** Arma los servicios sobre una base en memoria vacía. */
async function createEmptyServices(): Promise<TestServices> {
  return createTestServices(await createTestDatabase());
}

/**
 * Arma los servicios con una cuenta y un usuario de prueba ya dados de alta.
 *
 * Devuelve los tres para poder pasárselos enteros a `createApp`: si alguno
 * faltara, la app armaría el resto contra Neon.
 *
 * @param role Rol del usuario de prueba; `admin` para las rutas de gestión.
 * @returns Servicios y la cuenta creada, lista para iniciar sesión con
 * `TEST_USERNAME`.
 */
async function createTestServicesWithUser(
  role: UserRole = 'user',
): Promise<TestServices & { account: StoredAccount }> {
  const services = await createEmptyServices();
  const account = await services.accountService.create(TEST_ACCOUNT_NAME);

  await services.authService.createUser({
    accountId: account.id,
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    displayName: TEST_DISPLAY_NAME,
    role,
  });

  return { ...services, account };
}

/**
 * Levanta la app con una sesión iniciada, para los test de rutas protegidas.
 *
 * La cuenta de prueba arranca con su configuración de GitLab ya guardada y el
 * usuario con su nickname cargado: sin la configuración el tablero responde
 * 409, y casi todos los test la dan por hecha. Para probar el caso contrario
 * alcanza con `gitlabSettingsService.remove(account.id)`.
 *
 * @param options Dependencias del tablero que el test quiera reemplazar.
 * @param role Rol del usuario de la sesión.
 * @returns App, servicios, cuenta, usuario y la cookie de sesión a reenviar.
 */
async function createAuthenticatedApp(
  options: CreateAppOptions = {},
  role: UserRole = 'user',
): Promise<AuthenticatedTestApp> {
  const { account, accountService, authService, gitlabSettingsService } = await createTestServicesWithUser(role);

  const { user, token } = await authService.login({
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
  });

  await authService.changeGitlabUsername(user.id, TEST_GITLAB_USERNAME);
  await gitlabSettingsService.save(account.id, {
    projectIds: TEST_PROJECT_IDS,
    accessToken: TEST_TOKEN,
  });

  return {
    app: createApp({ ...options, accountService, authService, gitlabSettingsService }),
    accountService,
    authService,
    gitlabSettingsService,
    account,
    user: { ...user, gitlabUsername: TEST_GITLAB_USERNAME },
    cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

export {
  createAuthenticatedApp,
  createEmptyServices,
  createTestAccountService,
  createTestDatabase,
  createTestGitLabSettingsService,
  createTestRepository,
  createTestServices,
  createTestServicesWithUser,
};
export type { TestServices };

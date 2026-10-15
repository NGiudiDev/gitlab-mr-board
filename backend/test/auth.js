import { TEST_ACCOUNT_NAME, TEST_DISPLAY_NAME, TEST_EMAIL, TEST_ENCRYPTION_KEY, TEST_GITLAB_USERNAME, TEST_PASSWORD, TEST_PROJECT_IDS, TEST_TOKEN } from "./constants.js";

import { createSecretCipher } from "../src/features/gitlabSettings/utils/encryption.js";

import { createApp } from "../src/app.js";
import { createAccountRepository } from "../src/features/accounts/services/accountRepository.js";
import { createAccountService } from "../src/features/accounts/services/accountService.js";
import { SESSION_COOKIE_NAME } from "../src/features/auth/routes/auth.js";
import { createAuthRepository } from "../src/features/auth/services/authRepository.js";
import { createAuthService } from "../src/features/auth/services/authService.js";
import { createGitLabSettingsRepository } from "../src/features/gitlabSettings/services/gitlabSettingsRepository.js";
import { createGitLabSettingsService } from "../src/features/gitlabSettings/services/gitlabSettingsService.js";
import { createMergeRequestUploadDateRepository } from "../src/features/mergeRequests/services/mergeRequestUploadDateRepository.js";
import { createMergeRequestUploadDateService } from "../src/features/mergeRequests/services/mergeRequestUploadDateService.js";
import { createUserRepository } from "../src/features/users/services/userRepository.js";
import { createUserService } from "../src/features/users/services/userService.js";
import { createTestDatabase } from "./database.js";

/** Crea el servicio de cuentas sobre una base ya abierta. */
function createTestAccountService(database) {
  return createAccountService({ repository: createAccountRepository(database) });
}

/**
 * Crea el servicio de configuración de GitLab sobre una base ya abierta.
 *
 * @param database Base compartida con el resto de los servicios.
 * @returns Servicio listo para guardar y leer configuraciones.
 */
function createTestGitLabSettingsService(database) {
  return createGitLabSettingsService({
    repository: createGitLabSettingsRepository(database),
    cipher: createSecretCipher(TEST_ENCRYPTION_KEY),
  });
}

/**
 * Arma los servicios sobre una misma base en memoria.
 *
 * Comparten la conexión porque las claves foráneas entre sus tablas sólo valen
 * dentro de la misma base.
 *
 * @param database Base con el esquema ya aplicado.
 * @returns Servicios de cuentas, autenticación, usuarios y configuración de GitLab.
 */
function createTestServices(database) {
  const accountService = createTestAccountService(database);
  const authRepository = createAuthRepository(database);
  const userService = createUserService({
    repository: createUserRepository(database),
    invalidateSessions: authRepository.deleteSessionsOfUser,
  });

  return {
    accountService,
    authService: createAuthService({
      repository: authRepository,
      accountService,
      userService,
    }),
    gitlabSettingsService: createTestGitLabSettingsService(database),
    mergeRequestUploadDateService: createMergeRequestUploadDateService({
      repository: createMergeRequestUploadDateRepository(database),
    }),
    userService,
  };
}

/** Arma los servicios sobre una base en memoria vacía. */
async function createEmptyServices() {
  return createTestServices(await createTestDatabase());
}

/**
 * Arma los servicios con una cuenta y un usuario de prueba ya dados de alta.
 *
 * Devuelve todos para poder pasárselos enteros a `createApp`: si alguno
 * faltara, la app armaría el resto contra Neon.
 *
 * @param role Rol del usuario de prueba; `admin` para las rutas de gestión.
 * @returns Servicios y la cuenta creada, lista para iniciar sesión con
 * `TEST_EMAIL`.
 */
async function createTestServicesWithUser(role = "user") {
  const services = await createEmptyServices();
  const account = await services.accountService.create(TEST_ACCOUNT_NAME);

  await services.userService.createUser({
    accountId: account.id,
    email: TEST_EMAIL,
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
async function createAuthenticatedApp(options = {}, role = "user") {
  const {
    account,
    accountService,
    authService,
    gitlabSettingsService,
    mergeRequestUploadDateService,
    userService,
  } = await createTestServicesWithUser(role);

  const { user, token } = await authService.login({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  await userService.changeGitlabUsername(user.id, TEST_GITLAB_USERNAME);
  await gitlabSettingsService.save(account.id, {
    projectIds: TEST_PROJECT_IDS,
    accessToken: TEST_TOKEN,
  });

  return {
    app: createApp({
      ...options,
      accountService,
      authService,
      gitlabSettingsService,
      mergeRequestUploadDateService,
      userService,
    }),
    accountService,
    authService,
    gitlabSettingsService,
    mergeRequestUploadDateService,
    userService,
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
  createTestServices,
  createTestServicesWithUser,
};

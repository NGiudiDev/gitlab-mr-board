/** Valores que deben coincidir con `test/setup.ts`. */
const TEST_BASE_URL = 'https://gitlab.example.com';

/** Configuración de GitLab que se guarda para la cuenta de `test/auth.ts`. */
const TEST_TOKEN = 'token-de-prueba-no-real';
const TEST_PROJECT_IDS = ['101', '202'];
const TEST_GITLAB_USERNAME = 'ana-gitlab';

/** Clave con la que se cifran los token en los test; nunca es la real. */
const TEST_ENCRYPTION_KEY = 'clave-de-cifrado-solo-para-los-test';

/** Cuenta y credenciales que crean los helpers de `test/auth.ts`. */
const TEST_ACCOUNT_NAME = 'Equipo de prueba';
const TEST_DISPLAY_NAME = 'Ana Prueba';
const TEST_EMAIL = 'ana@example.com';
const TEST_PASSWORD = 'contrasena-de-prueba';

export {
  TEST_ACCOUNT_NAME,
  TEST_BASE_URL,
  TEST_DISPLAY_NAME,
  TEST_EMAIL,
  TEST_ENCRYPTION_KEY,
  TEST_GITLAB_USERNAME,
  TEST_PASSWORD,
  TEST_PROJECT_IDS,
  TEST_TOKEN,
};

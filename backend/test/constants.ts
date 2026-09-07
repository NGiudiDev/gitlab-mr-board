/** Valores que deben coincidir con `test/setup.ts`. */
const TEST_BASE_URL = 'https://gitlab.example.com';

/** Configuración de GitLab que se guarda para el usuario de `test/auth.ts`. */
const TEST_TOKEN = 'token-de-prueba-no-real';
const TEST_PROJECT_IDS = ['101', '202'];

/** Clave con la que se cifran los token en los test; nunca es la real. */
const TEST_ENCRYPTION_KEY = 'clave-de-cifrado-solo-para-los-test';

/** Credenciales del usuario que crean los helpers de `test/auth.ts`. */
const TEST_USERNAME = 'ana';
const TEST_DISPLAY_NAME = 'Ana Prueba';
const TEST_PASSWORD = 'contrasena-de-prueba';

export {
  TEST_BASE_URL,
  TEST_DISPLAY_NAME,
  TEST_ENCRYPTION_KEY,
  TEST_PASSWORD,
  TEST_PROJECT_IDS,
  TEST_TOKEN,
  TEST_USERNAME,
};

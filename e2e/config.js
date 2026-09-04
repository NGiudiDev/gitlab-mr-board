import { fileURLToPath } from 'node:url';

/**
 * Configuración de los test E2E. Se resuelve al cargar `playwright.config.js`
 * para que la suite falle con un mensaje claro antes de levantar los
 * servidores, en lugar de hacerlo a mitad del recorrido.
 */

const environmentFilePath = fileURLToPath(new URL('../.env', import.meta.url));

/**
 * Carga el `.env` de la raíz si existe. Node no lo sobrescribe con lo que ya
 * está en el entorno, así que los secretos de CI siguen teniendo prioridad.
 */
function loadEnvironmentFile() {
  try {
    process.loadEnvFile(environmentFilePath);
  } catch {
    // Sin archivo local: las variables tienen que venir del entorno.
  }
}

/** Variables obligatorias y para qué sirve cada una. */
const REQUIRED_VARIABLES = {
  GITLAB_TOKEN: 'PAT de GitLab con alcance read_api sobre los proyectos de test',
  E2E_PROJECT_IDS: 'IDs de los proyectos de GitLab dedicados a test, separados por comas',
  E2E_PROJECT_PATH: 'Ruta `grupo/proyecto` de la sección que expande el recorrido',
  E2E_MR_TITLE: 'Título exacto del merge request abierto que verifica el recorrido',
  E2E_MR_COLUMN: 'Columna del tablero donde debe aparecer ese merge request',
};

// El backend sólo acepta CORS desde 5173 y 4173. La suite usa 4173 —el puerto
// del build servido con `vite preview`— para no competir con `npm run dev`.
const FRONTEND_PORT = 4173;
const BACKEND_PORT = 3101;

/** Lee una variable obligatoria y acumula las que falten. */
function readRequiredVariables() {
  const missing = Object.keys(REQUIRED_VARIABLES).filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    const detail = missing.map((name) => `  - ${name}: ${REQUIRED_VARIABLES[name]}`);

    throw new Error([
      'Los test E2E no pueden ejecutarse: faltan variables de entorno.',
      ...detail,
      '',
      'Los E2E corren contra GitLab real: usá proyectos creados para test.',
      'Copiá .env.example como .env en la raíz o exportá las variables.',
    ].join('\n'));
  }
}

loadEnvironmentFile();
readRequiredVariables();

const e2eConfig = {
  gitlabToken: process.env.GITLAB_TOKEN.trim(),
  gitlabBaseUrl: process.env.E2E_GITLAB_BASE_URL?.trim() || 'https://gitlab.com',
  projectIds: process.env.E2E_PROJECT_IDS.trim(),
  projectPath: process.env.E2E_PROJECT_PATH.trim(),
  mergeRequestTitle: process.env.E2E_MR_TITLE.trim(),
  mergeRequestColumn: process.env.E2E_MR_COLUMN.trim(),
  backendUrl: `http://localhost:${BACKEND_PORT}`,
  frontendUrl: `http://localhost:${FRONTEND_PORT}`,
  frontendPort: FRONTEND_PORT,
  backendPort: BACKEND_PORT,
};

export default e2eConfig;

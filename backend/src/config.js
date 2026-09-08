// 1. Módulos estándar de Node.js.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 2. Dependencias externas.
import dotenv from 'dotenv';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentFilePath = path.resolve(currentDirectory, '..', '.env');
const requiredEnvironmentVariables = ['DATABASE_URL', 'ENCRYPTION_KEY'];

dotenv.config({ path: environmentFilePath });

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((key) => !process.env[key]);

if (missingEnvironmentVariables.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${missingEnvironmentVariables.join(', ')}`);
  console.error('Copiá .env.example como .env y completá los valores.');

  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!databaseUrl || !encryptionKey) {
  throw new Error('La configuración obligatoria no está disponible.');
}

/**
 * Convierte una variable numérica y conserva el valor predeterminado cuando
 * está vacía, no es un número o vale cero.
 */
function parseIntegerOrDefault(value, defaultValue) {
  return Number.parseInt(value ?? '', 10) || defaultValue;
}

const config = {
  // La instancia de GitLab es una sola para todo el tablero; el token y los
  // proyectos, en cambio, los configura cada persona desde «Mi cuenta».
  gitlabBaseUrl: (process.env.GITLAB_BASE_URL || 'https://gitlab.com').replace(/\/+$/, ''),
  port: parseIntegerOrDefault(process.env.PORT, 3001),
  cacheTtlMs: parseIntegerOrDefault(process.env.POLL_CACHE_TTL_MS, 60_000),
  teamLeadUsername: process.env.TEAM_LEAD_USERNAME || 'NGiudi',
  minApprovals: parseIntegerOrDefault(process.env.MIN_APPROVALS, 2),
  // Cadena de conexión de Neon. Conviene la del pooler: el backend abre un
  // pool propio y las conexiones directas de Postgres son un recurso escaso.
  databaseUrl,
  sessionDurationDays: parseIntegerOrDefault(process.env.SESSION_DURATION_DAYS, 7),
  // La cookie de sesión sólo puede exigir HTTPS donde efectivamente lo hay.
  cookieSecure: (process.env.COOKIE_SECURE || String(process.env.NODE_ENV === 'production')) === 'true',
  // Cifra los access token de GitLab guardados en la base. Cambiarla vuelve
  // ilegibles los tokens ya guardados: hay que cargarlos de nuevo.
  encryptionKey,
};

export default config;

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentFilePath = path.resolve(currentDirectory, '..', '.env');
const requiredEnvironmentVariables = ['GITLAB_TOKEN', 'PROJECT_IDS'] as const;

dotenv.config({ path: environmentFilePath });

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((key) => !process.env[key]);

if (missingEnvironmentVariables.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${missingEnvironmentVariables.join(', ')}`);
  console.error('Copiá .env.example como .env y completá los valores.');

  process.exit(1);
}

const gitlabToken = process.env.GITLAB_TOKEN;
const projectIds = process.env.PROJECT_IDS;

if (!gitlabToken || !projectIds) {
  throw new Error('La configuración obligatoria no está disponible.');
}

/**
 * Convierte una variable numérica y conserva el valor predeterminado cuando
 * está vacía, no es un número o vale cero.
 */
function parseIntegerOrDefault(value: string | undefined, defaultValue: number): number {
  return Number.parseInt(value ?? '', 10) || defaultValue;
}

/** Convierte la lista separada por comas en IDs limpios y no vacíos. */
function parseProjectIds(value: string): string[] {
  return value
    .split(',')
    .map((projectId) => projectId.trim())
    .filter(Boolean);
}

const config = {
  gitlabToken,
  gitlabBaseUrl: (process.env.GITLAB_BASE_URL || 'https://gitlab.com').replace(/\/+$/, ''),
  projectIds: parseProjectIds(projectIds),
  port: parseIntegerOrDefault(process.env.PORT, 3001),
  cacheTtlMs: parseIntegerOrDefault(process.env.POLL_CACHE_TTL_MS, 60_000),
  teamLeadUsername: process.env.TEAM_LEAD_USERNAME || 'NGiudi',
  minApprovals: parseIntegerOrDefault(process.env.MIN_APPROVALS, 2),
};

export default config;

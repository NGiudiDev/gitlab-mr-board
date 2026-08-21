import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(currentDirectory, '..', '.env') });

const required = ['GITLAB_TOKEN', 'PROJECT_IDS'] as const;

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  console.error('Copiá .env.example como .env y completá los valores.');

  process.exit(1);
}

const gitlabToken = process.env.GITLAB_TOKEN;
const projectIds = process.env.PROJECT_IDS;

if (!gitlabToken || !projectIds) {
  throw new Error('La configuración obligatoria no está disponible.');
}

const config = {
  gitlabToken,
  gitlabBaseUrl: (process.env.GITLAB_BASE_URL || 'https://gitlab.com').replace(/\/+$/, ''),
  projectIds: projectIds.split(',').map((id) => id.trim()).filter(Boolean),
  port: Number.parseInt(process.env.PORT ?? '', 10) || 3001,
  cacheTtlMs: Number.parseInt(process.env.POLL_CACHE_TTL_MS ?? '', 10) || 60000,
  teamLeadUsername: process.env.TEAM_LEAD_USERNAME || 'NGiudi',
  minApprovals: Number.parseInt(process.env.MIN_APPROVALS ?? '', 10) || 2,
};

export default config;

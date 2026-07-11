const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const required = ['GITLAB_TOKEN', 'PROJECT_IDS'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const config = {
  gitlabToken: process.env.GITLAB_TOKEN,
  gitlabBaseUrl: (process.env.GITLAB_BASE_URL || 'https://gitlab.com').replace(/\/+$/, ''),
  projectIds: process.env.PROJECT_IDS.split(',').map((id) => id.trim()).filter(Boolean),
  port: parseInt(process.env.PORT, 10) || 3001,
  cacheTtlMs: parseInt(process.env.POLL_CACHE_TTL_MS, 10) || 60000,
  teamLeadUsername: process.env.TEAM_LEAD_USERNAME || 'NGiudi',
  minApprovals: parseInt(process.env.MIN_APPROVALS, 10) || 2,
};

module.exports = config;

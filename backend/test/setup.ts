/**
 * Fija la configuración antes de que `src/config.ts` la lea. `dotenv` no
 * sobrescribe variables existentes, por lo que la suite queda aislada del
 * archivo `.env` local y de cualquier token real.
 */
process.env.GITLAB_TOKEN = 'token-de-prueba-no-real';
process.env.GITLAB_BASE_URL = 'https://gitlab.example.com/';
process.env.PROJECT_IDS = '101,202';
process.env.PORT = '0';
process.env.POLL_CACHE_TTL_MS = '60000';
process.env.TEAM_LEAD_USERNAME = 'lider';
process.env.MIN_APPROVALS = '2';

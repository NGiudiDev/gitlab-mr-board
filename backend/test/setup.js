/**
 * Fija la configuración antes de que `src/config.ts` la lea. `dotenv` no
 * sobrescribe variables existentes, por lo que la suite queda aislada del
 * archivo `.env` local y de cualquier token real.
 *
 * El token y los proyectos de GitLab ya no son configuración del proceso: los
 * guarda cada usuario, y `test/constants.ts` tiene los valores de prueba.
 */
process.env.GITLAB_BASE_URL = 'https://gitlab.example.com/';
process.env.PORT = '0';
process.env.POLL_CACHE_TTL_MS = '60000';
process.env.TEAM_LEAD_USERNAME = 'lider';
process.env.MIN_APPROVALS = '2';
// Cada test abre su propio Postgres en memoria con PGlite, así que esta cadena
// nunca se usa para conectarse: sólo evita que `config.ts` aborte el arranque.
process.env.DATABASE_URL = 'postgres://no-se-usa-en-los-test/tablero';
process.env.SESSION_DURATION_DAYS = '7';
process.env.COOKIE_SECURE = 'false';
process.env.ENCRYPTION_KEY = 'clave-de-cifrado-solo-para-los-test';

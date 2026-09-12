// 2. Dependencias externas.
import { neonConfig, Pool } from '@neondatabase/serverless';

// El esquema se aplica en cada arranque: `IF NOT EXISTS` lo vuelve idempotente
// y evita sumar una herramienta de migraciones para cuatro tablas.
//
// Cada sentencia va por separado porque el driver acepta una por consulta.
const SCHEMA_STATEMENTS = [
  // La cuenta es la unidad que comparte el tablero: sus miembros ven los
  // mismos proyectos, consultados con las mismas credenciales de GitLab.
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
    gitlab_username TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ
  )`,

  // Conserva el identificador de instalaciones existentes. Puede seguir
  // usándose para ingresar hasta que la persona lo reemplace por su email en
  // «Mi perfil»; las altas y modificaciones nuevas sí validan el formato.
  `DO $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username'
     ) AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
     ) THEN
       ALTER TABLE users RENAME COLUMN username TO email;
     END IF;
   END $$`,

  // `CREATE TABLE IF NOT EXISTS` no toca una tabla que ya existe, así que una
  // columna agregada después necesita su propio `ALTER`. Las dos entran
  // nullable porque una tabla con filas no admite otra cosa; `account_id` pasa
  // a obligatoria recién al final, cuando ya está completa.
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS gitlab_username TEXT',

  'CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id)',

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`,

  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',

  // Las credenciales son de la cuenta: las carga un administrador y con ellas
  // se arma el tablero de todos sus miembros.
  `CREATE TABLE IF NOT EXISTS account_gitlab_settings (
    account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    project_ids TEXT[] NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,

  // Los usuarios anteriores a las cuentas se agrupan en una sola: ya eran un
  // equipo que miraba el mismo tablero, así que lo siguen compartiendo.
  `INSERT INTO accounts (id, name, invite_code, created_at)
   SELECT gen_random_uuid()::text, 'Mi equipo', upper(substr(md5(random()::text), 1, 10)), now()
   WHERE EXISTS (SELECT 1 FROM users WHERE account_id IS NULL)`,

  `UPDATE users
   SET account_id = (SELECT id FROM accounts ORDER BY created_at LIMIT 1)
   WHERE account_id IS NULL`,

  // La configuración de GitLab dejó de ser de cada persona. El bloque corre
  // sólo mientras exista la tabla vieja: rescata de ella el nickname de cada
  // uno y la configuración más reciente de la cuenta, y descarta el resto,
  // porque ahora hay un solo token por cuenta. Va en un `DO` porque una
  // sentencia suelta contra una tabla inexistente falla en una base nueva.
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'gitlab_settings'
     ) THEN
       RETURN;
     END IF;

     UPDATE users
     SET gitlab_username = previous.gitlab_username
     FROM gitlab_settings AS previous
     WHERE previous.user_id = users.id AND users.gitlab_username IS NULL;

     INSERT INTO account_gitlab_settings (account_id, project_ids, encrypted_access_token, updated_at)
     SELECT DISTINCT ON (member.account_id)
       member.account_id, previous.project_ids, previous.encrypted_access_token, previous.updated_at
     FROM gitlab_settings AS previous
     JOIN users AS member ON member.id = previous.user_id
     ORDER BY member.account_id, previous.updated_at DESC
     ON CONFLICT (account_id) DO NOTHING;

     DROP TABLE gitlab_settings;
   END $$`,

  // Ya no quedan usuarios sin cuenta, así que la columna puede exigirse.
  // Repetir la sentencia sobre una columna que ya es obligatoria no hace nada.
  'ALTER TABLE users ALTER COLUMN account_id SET NOT NULL',
];

// El driver habla el protocolo de Postgres sobre WebSocket. Node 24 ya trae la
// implementación como global, así que dejarla explícita evita depender de la
// autodetección del paquete.
neonConfig.webSocketConstructor ??= globalThis.WebSocket;

/**
 * Normaliza a ISO 8601 una marca temporal leída de Postgres.
 *
 * El driver devuelve `Date` para `TIMESTAMPTZ`, pero el contrato del dominio
 * usa cadenas ISO; la rama de texto cubre a cualquier driver que no convierta.
 *
 * @param value Valor tal como llega de la base.
 * @returns La misma marca temporal en ISO 8601.
 */
function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Abre el pool de conexiones contra Neon.
 *
 * El pool es perezoso: no abre ninguna conexión hasta la primera consulta, así
 * que construirlo no falla aunque la base no esté disponible todavía.
 *
 * @param connectionString Cadena de conexión de Neon (`DATABASE_URL`).
 * @returns Acceso a la base, con el resultado ya normalizado.
 */
function createNeonDatabase(connectionString) {
  const pool = new Pool({ connectionString });

  // Un cliente ocioso que se cae —Neon suspende la computación tras un rato de
  // inactividad— emite `error` en el pool. Sin este listener, Node convierte
  // ese evento en una excepción no capturada y termina el proceso: el pool
  // descarta la conexión rota por su cuenta y la siguiente consulta abre otra.
  pool.on('error', (error) => {
    console.error('Error en una conexión ociosa del pool:', error);
  });

  return {
    async query(text, params = []) {
      const result = await pool.query(text, params);

      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    },

    close: () => pool.end(),
  };
}

/**
 * Aplica el esquema. Hay que llamarla una vez al arrancar, antes de atender
 * pedidos: a diferencia de SQLite, la base es remota y el esquema no se puede
 * crear dentro de la misma operación que la abre.
 *
 * @param database Base ya abierta.
 * @throws {Error} Si alguna sentencia del esquema falla.
 */
async function applySchema(database) {
  for (const statement of SCHEMA_STATEMENTS) {
    await database.query(statement);
  }
}

export { applySchema, createNeonDatabase, toIsoString };

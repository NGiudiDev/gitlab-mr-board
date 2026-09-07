// 2. Dependencias externas.
import { neonConfig, Pool } from '@neondatabase/serverless';

// 4. Imports exclusivos de tipos de TypeScript.
import type { Database } from './types.js';

// El esquema se aplica en cada arranque: `IF NOT EXISTS` lo vuelve idempotente
// y evita sumar una herramienta de migraciones para tres tablas.
//
// Cada sentencia va por separado porque el driver acepta una por consulta.
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`,

  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',

  `CREATE TABLE IF NOT EXISTS gitlab_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    project_ids TEXT[] NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
];

// El driver habla el protocolo de Postgres sobre WebSocket. Node 22 ya trae la
// implementación como global, así que dejarla explícita evita depender de la
// autodetección del paquete.
neonConfig.webSocketConstructor ??= globalThis.WebSocket as never;

/**
 * Normaliza a ISO 8601 una marca temporal leída de Postgres.
 *
 * El driver devuelve `Date` para `TIMESTAMPTZ`, pero el contrato del dominio
 * usa cadenas ISO; la rama de texto cubre a cualquier driver que no convierta.
 *
 * @param value Valor tal como llega de la base.
 * @returns La misma marca temporal en ISO 8601.
 */
function toIsoString(value: Date | string): string {
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
function createNeonDatabase(connectionString: string): Database {
  const pool = new Pool({ connectionString });

  // Un cliente ocioso que se cae —Neon suspende la computación tras un rato de
  // inactividad— emite `error` en el pool. Sin este listener, Node convierte
  // ese evento en una excepción no capturada y termina el proceso: el pool
  // descarta la conexión rota por su cuenta y la siguiente consulta abre otra.
  pool.on('error', (error: unknown) => {
    console.error('Error en una conexión ociosa del pool:', error);
  });

  return {
    async query<T>(text: string, params: unknown[] = []) {
      const result = await pool.query(text, params);

      return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
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
async function applySchema(database: Database): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await database.query(statement);
  }
}

export { applySchema, createNeonDatabase, toIsoString };

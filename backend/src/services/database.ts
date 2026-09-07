// 1. Módulos estándar de Node.js.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const IN_MEMORY_LOCATION = ':memory:';

// El esquema se aplica en cada arranque: `IF NOT EXISTS` lo vuelve idempotente
// y evita sumar una herramienta de migraciones para tres tablas.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS gitlab_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    project_ids TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

/**
 * Crea el directorio contenedor de la base para que el primer arranque no
 * falle en una instalación limpia.
 *
 * @param location Ruta del archivo SQLite, o `:memory:`.
 */
function ensureDirectory(location: string): void {
  if (location === IN_MEMORY_LOCATION) return;

  mkdirSync(path.dirname(path.resolve(location)), { recursive: true });
}

/**
 * Abre la base SQLite local y deja el esquema aplicado.
 *
 * Los repositorios comparten esta única conexión: las claves foráneas entre
 * sus tablas sólo funcionan dentro de la misma base abierta, y con `:memory:`
 * cada conexión sería una base distinta.
 *
 * @param location Ruta del archivo, o `:memory:` para los test.
 * @returns Conexión lista para preparar sentencias.
 * @throws {Error} Si el archivo no se puede abrir o el esquema no se aplica.
 */
function openDatabase(location: string): DatabaseSync {
  ensureDirectory(location);

  const database = new DatabaseSync(location);

  // `ON DELETE CASCADE` sólo actúa con las claves foráneas habilitadas, y SQLite
  // las deja apagadas por compatibilidad.
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(SCHEMA);

  return database;
}

export { IN_MEMORY_LOCATION, openDatabase };

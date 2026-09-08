// 2. Dependencias externas.
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';

// 6. Imports relativos restantes.
import { applySchema } from './database.js';

// Esquema tal como quedó antes de las cuentas: los usuarios no pertenecían a
// ninguna y la configuración de GitLab era de cada persona.
const PREVIOUS_SCHEMA = [
  `CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ
  )`,

  `CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`,

  `CREATE TABLE gitlab_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    project_ids TEXT[] NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    gitlab_username TEXT,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
];

let openInstances = [];

/** Envuelve PGlite en la interfaz mínima que espera `applySchema`. */
function toDatabase(pglite) {
  return {
    async query(text, params = []) {
      const result = await pglite.query(text, params);

      return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
    },
    close: () => pglite.close(),
  };
}

/**
 * Abre una base vacía propia del test.
 *
 * No se reutiliza la de `test/database.ts` porque esa ya viene con el esquema
 * aplicado, y acá lo que se prueba es justamente aplicarlo.
 */
async function openEmptyDatabase() {
  const pglite = new PGlite();
  await pglite.waitReady;
  openInstances.push(pglite);

  return toDatabase(pglite);
}

/** Abre una base con el esquema anterior a las cuentas y datos cargados. */
async function openPreviousDatabase() {
  const database = await openEmptyDatabase();

  for (const statement of PREVIOUS_SCHEMA) await database.query(statement);

  await database.query(
    `INSERT INTO users (id, username, display_name, password_hash, role, status, created_at, last_login_at)
     VALUES ('usuario-1', 'ana', 'Ana', 'scrypt$1$1$1$aa$bb', 'admin', 'active', now(), NULL),
            ('usuario-2', 'beto', 'Beto', 'scrypt$1$1$1$cc$dd', 'user', 'active', now(), NULL)`,
  );
  await database.query(
    `INSERT INTO gitlab_settings (user_id, project_ids, encrypted_access_token, gitlab_username, updated_at)
     VALUES ('usuario-1', ARRAY['101'], 'v1.token-de-ana', 'ana-gitlab', '2026-09-01T10:00:00Z'),
            ('usuario-2', ARRAY['202','303'], 'v1.token-de-beto', 'beto-gitlab', '2026-09-02T10:00:00Z')`,
  );

  return database;
}

afterEach(async () => {
  for (const pglite of openInstances) await pglite.close();
  openInstances = [];
});

describe('applySchema', () => {
  it('crea las cuatro tablas en una base vacía', async () => {
    const database = await openEmptyDatabase();

    await applySchema(database);

    const { rows } = await database.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`,
    );

    expect(rows.map((row) => row.table_name))
      .toEqual(['account_gitlab_settings', 'accounts', 'sessions', 'users']);
  });

  it('es idempotente: aplicarlo dos veces no falla ni duplica cuentas', async () => {
    const database = await openPreviousDatabase();

    await applySchema(database);
    await applySchema(database);

    const { rows } = await database.query(
      'SELECT COUNT(*) AS total FROM accounts',
    );

    expect(Number(rows[0]?.total)).toBe(1);
  });
});

describe('migración a cuentas', () => {
  it('agrupa en una sola cuenta a los usuarios que no tenían ninguna', async () => {
    const database = await openPreviousDatabase();

    await applySchema(database);

    const { rows } = await database.query(
      `SELECT users.username, accounts.name
       FROM users JOIN accounts ON accounts.id = users.account_id
       ORDER BY users.username`,
    );

    expect(rows).toEqual([
      { username: 'ana', name: 'Mi equipo' },
      { username: 'beto', name: 'Mi equipo' },
    ]);
  });

  it('deja la cuenta con un código de invitación usable', async () => {
    const database = await openPreviousDatabase();

    await applySchema(database);

    const { rows } = await database.query('SELECT invite_code FROM accounts');

    expect(rows[0]?.invite_code).toMatch(/^[0-9A-F]{10}$/);
  });

  it('conserva el nickname de GitLab de cada persona', async () => {
    const database = await openPreviousDatabase();

    await applySchema(database);

    const { rows } = await database.query(
      'SELECT username, gitlab_username FROM users ORDER BY username',
    );

    expect(rows).toEqual([
      { username: 'ana', gitlab_username: 'ana-gitlab' },
      { username: 'beto', gitlab_username: 'beto-gitlab' },
    ]);
  });

  it('pasa a la cuenta la configuración de GitLab guardada más recientemente', async () => {
    const database = await openPreviousDatabase();

    await applySchema(database);

    const { rows } = await database.query(
      'SELECT project_ids, encrypted_access_token FROM account_gitlab_settings',
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.project_ids).toEqual(['202', '303']);
    expect(rows[0]?.encrypted_access_token).toBe('v1.token-de-beto');
  });

  it('descarta la tabla vieja, para no dejar tokens sueltos', async () => {
    const database = await openPreviousDatabase();

    await applySchema(database);

    const { rows } = await database.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'gitlab_settings'`,
    );

    expect(rows).toHaveLength(0);
  });

  it('conserva las sesiones abiertas: nadie tiene que volver a ingresar', async () => {
    const database = await openPreviousDatabase();
    await database.query(
      `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
       VALUES ('sesion-1', 'usuario-1', 'hash-1', now(), now() + interval '7 days')`,
    );

    await applySchema(database);

    const { rows } = await database.query('SELECT id FROM sessions');

    expect(rows.map((row) => row.id)).toEqual(['sesion-1']);
  });
});

// 2. Dependencias externas.
import { PGlite } from '@electric-sql/pglite';

// 6. Imports relativos restantes.
import { applySchema } from '../src/shared/database.js';

// Arrancar PGlite cuesta alrededor de un segundo, así que se reutiliza una
// única instancia. Vitest aísla el registro de módulos por archivo de test, con
// lo cual cada archivo tiene la suya y los archivos no se pisan entre sí.
let sharedInstance = null;

/** Arranca PGlite y le aplica el esquema, una sola vez por archivo de test. */
async function getSharedInstance() {
  if (sharedInstance) return sharedInstance;

  const pglite = new PGlite();
  await pglite.waitReady;

  await applySchema(toDatabase(pglite));
  sharedInstance = pglite;

  return pglite;
}

/** Envuelve PGlite en la interfaz mínima que usan los repositorios. */
function toDatabase(pglite) {
  return {
    async query(text, params = []) {
      const result = await pglite.query(text, params);

      // PGlite llama `affectedRows` a lo que el driver de Neon llama `rowCount`.
      return { rows: result.rows, rowCount: result.affectedRows ?? 0 };
    },

    // La instancia se comparte con el resto del archivo, así que cerrarla acá
    // rompería los test siguientes. Se descarta al terminar el archivo.
    close: async () => {},
  };
}

/**
 * Devuelve una base Postgres vacía, aislada del test anterior.
 *
 * PGlite es Postgres compilado a WebAssembly y corre dentro del propio proceso
 * de Vitest, así que el SQL de los repositorios se ejecuta de verdad sin
 * necesitar red, Docker ni credenciales. Sólo se usa en los test: el código de
 * producción habla con Neon y no conoce esta pieza.
 *
 * **La instancia es una sola por archivo de test**: cada llamada vacía las
 * tablas, de modo que pedir dos bases dentro del mismo test no da dos bases
 * independientes, sino la misma recién vaciada.
 *
 * @returns Base con el esquema aplicado y sin datos.
 */
async function createTestDatabase() {
  const pglite = await getSharedInstance();

  // `accounts` arrastra en cascada sus usuarios y su configuración de GitLab,
  // y cada usuario sus sesiones.
  await pglite.exec('TRUNCATE accounts CASCADE');

  return toDatabase(pglite);
}

export { createTestDatabase };

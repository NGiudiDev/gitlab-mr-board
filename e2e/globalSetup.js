import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import e2eConfig from './config.js';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

/**
 * Ejecuta un subcomando de la CLI de usuarios contra la base de los E2E.
 *
 * Se pasa por la CLI y no por la base directamente porque el driver es una
 * dependencia de `backend/`, y `e2e/` corre desde la raíz.
 *
 * @param {string[]} args Subcomando y sus argumentos.
 * @param {string} [input] Lo que se manda por la entrada estándar.
 * @returns {import('node:child_process').SpawnSyncReturns<string>} El resultado.
 */
function runUsersCommand(args, input = '') {
  return spawnSync(
    'npm',
    ['run', 'users', '--prefix', 'backend', '--', ...args],
    {
      cwd: repositoryRoot,
      input,
      encoding: 'utf8',
      // `npm` es un script, no un ejecutable: en Windows necesita la shell.
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: e2eConfig.databaseUrl,
        ENCRYPTION_KEY: e2eConfig.encryptionKey,
      },
    },
  );
}

/**
 * Deja el usuario del recorrido recién creado, con una cuenta propia y sin
 * configurar.
 *
 * Antes alcanzaba con borrar el archivo de SQLite. Ahora la base es remota, así
 * que se borra el usuario y se lo vuelve a crear con una cuenta nueva: esa
 * cuenta no tiene proyectos ni token, y el recorrido arranca desde «todavía no
 * configuraste». Sólo se toca ese usuario, nunca el resto de la base; las
 * cuentas de corridas anteriores quedan vacías y sin nadie que pueda entrar.
 *
 * La contraseña se manda por la entrada estándar: el script nunca la acepta por
 * argumento.
 */
export default function globalSetup() {
  // El invitado se borra primero: se da de alta durante el recorrido con el
  // código de la cuenta, y sin borrarlo la corrida siguiente choca con su
  // nombre ya tomado.
  const removedGuest = runUsersCommand(['delete', e2eConfig.guestEmail]);
  const removed = removedGuest.status === 0
    ? runUsersCommand(['delete', e2eConfig.email])
    : removedGuest;

  if (removed.status !== 0) {
    throw new Error([
      'No se pudo limpiar el usuario de los test E2E.',
      'Revisá E2E_DATABASE_URL y que la base esté disponible.',
      removed.stdout,
      removed.stderr,
    ].filter(Boolean).join('\n'));
  }

  // Sin `--invite` se abre una cuenta nueva y el usuario queda su
  // administrador, que es lo que necesita el recorrido para cargar los datos de
  // GitLab y llegar a la pantalla de usuarios.
  const created = runUsersCommand(
    [
      'create', e2eConfig.email,
      '--name', 'Usuario E2E',
      '--account', e2eConfig.accountName,
    ],
    `${e2eConfig.password}\n${e2eConfig.password}\n`,
  );

  if (created.status !== 0) {
    throw new Error([
      'No se pudo crear el usuario de los test E2E.',
      created.stdout,
      created.stderr,
    ].filter(Boolean).join('\n'));
  }
}

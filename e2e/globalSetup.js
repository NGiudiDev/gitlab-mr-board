import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import e2eConfig from './config.js';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

/**
 * Prepara la base de sesiones antes de levantar los servidores.
 *
 * Se borra y se recrea en cada corrida para que el recorrido siempre arranque
 * con el mismo usuario y sin sesiones viejas. La contraseña se manda por la
 * entrada estándar: el script nunca la acepta por argumento.
 */
export default function globalSetup() {
  rmSync(e2eConfig.databasePath, { force: true });

  const result = spawnSync(
    'npm',
    [
      'run', 'users', '--prefix', 'backend', '--',
      'create', e2eConfig.username,
      '--name', 'Usuario E2E',
      // Administrador, para que el recorrido llegue a la pantalla de usuarios.
      '--role', 'admin',
    ],
    {
      cwd: repositoryRoot,
      input: `${e2eConfig.password}\n${e2eConfig.password}\n`,
      encoding: 'utf8',
      // `npm` es un script, no un ejecutable: en Windows necesita la shell.
      shell: true,
      env: {
        ...process.env,
        DATABASE_PATH: e2eConfig.databasePath,
        ENCRYPTION_KEY: e2eConfig.encryptionKey,
      },
    },
  );

  if (result.status !== 0) {
    throw new Error([
      'No se pudo crear el usuario de los test E2E.',
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
}

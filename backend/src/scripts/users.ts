// 1. Módulos estándar de Node.js.
import readline from 'node:readline';
import { Writable } from 'node:stream';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthService, UserRole, UserStatus } from '../types.js';

// 7. Imports relativos restantes.
import config from '../config.js';
import { createAuthRepository } from '../services/authRepository.js';
import { createAuthService } from '../services/authService.js';
import { applySchema, createNeonDatabase } from '../services/database.js';

const USAGE = `Gestión de usuarios del tablero.

  npm run users --prefix backend -- create <usuario> [--name "Nombre visible"] [--role admin]
  npm run users --prefix backend -- password <usuario>
  npm run users --prefix backend -- disable <usuario>
  npm run users --prefix backend -- enable <usuario>
  npm run users --prefix backend -- delete <usuario>
  npm run users --prefix backend -- list

Borrar un usuario arrastra sus sesiones y su configuración de GitLab.

La contraseña nunca se pasa por argumento: se pide por teclado y no se muestra.
El tablero también permite registrarse y administrar usuarios desde la interfaz.`;

/**
 * Lee el valor de una opción con formato `--clave valor`.
 *
 * @param args Argumentos posteriores al subcomando.
 * @param name Nombre de la opción, sin los guiones.
 * @returns El valor indicado, o `undefined` si la opción no está.
 */
function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;

  return args[index + 1];
}

/**
 * Lee las respuestas de una entrada redirigida, una por línea.
 *
 * @param count Cantidad de líneas esperadas.
 * @returns Las líneas leídas.
 * @throws {Error} Si la entrada trae menos líneas de las necesarias.
 */
async function readSecretsFromPipe(count: number): Promise<string[]> {
  let input = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) input += chunk as string;

  const lines = input.split(/\r?\n/).slice(0, count);
  if (lines.length < count || lines.some((line) => line === '')) {
    throw new Error(`La entrada debe traer ${count} líneas, una por cada dato pedido.`);
  }

  return lines;
}

/**
 * Pide varios datos por teclado ocultando lo que se escribe.
 *
 * Usa una sola interfaz de `readline` para todas las preguntas, porque abrir
 * una por pregunta deja la entrada consumida a mitad de camino.
 *
 * @param questions Textos de los prompts, en orden.
 * @returns Las respuestas, sin el salto de línea final.
 * @throws {Error} Si la entrada se cierra antes de responder.
 */
async function askSecretsInTerminal(questions: string[]): Promise<string[]> {
  let hideInput = false;

  // Se filtra la salida en vez de apagarla del todo para que el prompt sí se
  // vea, pero los caracteres tecleados no queden en pantalla.
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!hideInput) process.stdout.write(chunk as Buffer, encoding);
      callback();
    },
  });

  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  const answers: string[] = [];

  try {
    for (const question of questions) {
      const answer = await new Promise<string | null>((resolve) => {
        rl.once('close', () => resolve(null));
        rl.question(question, (value) => {
          hideInput = false;
          process.stdout.write('\n');
          resolve(value);
        });

        hideInput = true;
      });

      if (answer === null) throw new Error('Entrada cancelada.');

      answers.push(answer);
    }
  } finally {
    rl.close();
  }

  return answers;
}

/**
 * Pide datos sensibles por la vía que corresponda al entorno.
 *
 * @param questions Textos de los prompts, en orden.
 * @returns Las respuestas ingresadas.
 */
function askSecrets(questions: string[]): Promise<string[]> {
  // Sin terminal —una entrada redirigida desde un script— no hay eco que ocultar
  // ni prompt que mostrar: alcanza con leer una línea por dato.
  if (!process.stdin.isTTY) return readSecretsFromPipe(questions.length);

  return askSecretsInTerminal(questions);
}

/**
 * Pide la contraseña dos veces para descartar errores de tipeo.
 *
 * @returns La contraseña confirmada.
 * @throws {Error} Si las dos entradas no coinciden.
 */
async function askNewPassword(): Promise<string> {
  const [password, confirmation] = await askSecrets(['Contraseña: ', 'Repetí la contraseña: ']);

  if (password !== confirmation) {
    throw new Error('Las contraseñas no coinciden.');
  }

  return password ?? '';
}

/** Da de alta un usuario nuevo. */
async function createUserCommand(authService: AuthService, args: string[]): Promise<void> {
  const username = args[0];
  if (!username || username.startsWith('--')) {
    throw new Error('Indicá el nombre de usuario. Ejemplo: create ana');
  }

  const role = readOption(args, 'role') === 'admin' ? 'admin' : 'user';
  const user = await authService.createUser({
    username,
    password: await askNewPassword(),
    displayName: readOption(args, 'name'),
    role: role as UserRole,
  });

  console.log(`Usuario «${user.username}» creado con el rol ${user.role}.`);
}

/** Cambia la contraseña de un usuario existente y cierra sus sesiones. */
async function changePasswordCommand(authService: AuthService, args: string[]): Promise<void> {
  const username = args[0];
  if (!username) {
    throw new Error('Indicá el nombre de usuario. Ejemplo: password ana');
  }

  await authService.changePassword(username, await askNewPassword());

  console.log(`Contraseña actualizada. Se cerraron las sesiones abiertas de «${username}».`);
}

/** Habilita o deshabilita el acceso de un usuario. */
async function setStatusCommand(authService: AuthService, args: string[], status: UserStatus): Promise<void> {
  const username = args[0];
  if (!username) {
    throw new Error('Indicá el nombre de usuario. Ejemplo: disable ana');
  }

  const user = await authService.setUserStatus(username, status);

  console.log(status === 'disabled'
    ? `Usuario «${user.username}» deshabilitado. Se cerraron sus sesiones abiertas.`
    : `Usuario «${user.username}» habilitado de nuevo.`);
}

/** Borra un usuario junto con sus sesiones y su configuración de GitLab. */
async function deleteUserCommand(authService: AuthService, args: string[]): Promise<void> {
  const username = args[0];
  if (!username) {
    throw new Error('Indicá el nombre de usuario. Ejemplo: delete ana');
  }

  const deleted = await authService.deleteUser(username);

  console.log(deleted
    ? `Usuario «${username}» borrado, junto con sus sesiones y su configuración de GitLab.`
    : `No existía el usuario «${username}»; no había nada que borrar.`);
}

/** Lista los usuarios dados de alta. */
async function listUsersCommand(authService: AuthService): Promise<void> {
  const users = await authService.listUsers();

  if (users.length === 0) {
    console.log('Todavía no hay usuarios. Creá el primero acá, o registrate en el tablero: el primer registro queda administrador.');
    return;
  }

  for (const user of users) {
    console.log(`${user.username}\t${user.role}\t${user.status}\t${user.displayName}`);
  }
}

async function main(): Promise<void> {
  const [command = '', ...args] = process.argv.slice(2);
  const database = createNeonDatabase(config.databaseUrl);

  // El script puede ser lo primero que corra contra una base recién creada.
  await applySchema(database);

  const authService = createAuthService({
    repository: createAuthRepository(database),
    sessionDurationDays: config.sessionDurationDays,
  });

  try {
    if (command === 'create') {
      await createUserCommand(authService, args);
      return;
    }

    if (command === 'password') {
      await changePasswordCommand(authService, args);
      return;
    }

    if (command === 'disable' || command === 'enable') {
      await setStatusCommand(authService, args, command === 'disable' ? 'disabled' : 'active');
      return;
    }

    if (command === 'delete') {
      await deleteUserCommand(authService, args);
      return;
    }

    if (command === 'list') {
      await listUsersCommand(authService);
      return;
    }

    console.log(USAGE);
    process.exitCode = command ? 1 : 0;
  } finally {
    await authService.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

// 1. Módulos estándar de Node.js.
import readline from 'node:readline';
import { Writable } from 'node:stream';

// 6. Imports relativos restantes.
import config from '../config.js';
import { createAccountRepository } from '../features/accounts/services/accountRepository.js';
import { createAccountService } from '../features/accounts/services/accountService.js';
import { createAuthRepository } from '../features/auth/services/authRepository.js';
import { createAuthService } from '../features/auth/services/authService.js';
import { applySchema, createNeonDatabase } from '../shared/database.js';

const USAGE = `Gestión de cuentas y usuarios del tablero.

  npm run users --prefix backend -- create <email> [--name "Nombre visible"] [--account "Nombre de la cuenta"]
  npm run users --prefix backend -- create <email> --invite <código> [--name "Nombre visible"] [--role admin]
  npm run users --prefix backend -- password <email>
  npm run users --prefix backend -- disable <email>
  npm run users --prefix backend -- enable <email>
  npm run users --prefix backend -- delete <email>
  npm run users --prefix backend -- list
  npm run users --prefix backend -- accounts

Cada usuario pertenece a una cuenta, que es la que comparte los proyectos y el
access token de GitLab. Sin --invite, «create» abre una cuenta nueva y el
usuario queda su administrador; con --invite se suma a la cuenta de ese código.

Borrar un usuario arrastra sus sesiones. La cuenta y su configuración de GitLab
quedan en pie, incluso si era su último miembro.

La contraseña nunca se pasa por argumento: se pide por teclado y no se muestra.
El tablero también permite registrarse y administrar usuarios desde la interfaz.`;

/**
 * Lee el valor de una opción con formato `--clave valor`.
 *
 * @param args Argumentos posteriores al subcomando.
 * @param name Nombre de la opción, sin los guiones.
 * @returns El valor indicado, o `undefined` si la opción no está.
 */
function readOption(args, name) {
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
async function readSecretsFromPipe(count) {
  let input = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) input += chunk;

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
async function askSecretsInTerminal(questions) {
  let hideInput = false;

  // Se filtra la salida en vez de apagarla del todo para que el prompt sí se
  // vea, pero los caracteres tecleados no queden en pantalla.
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!hideInput) process.stdout.write(chunk, encoding);
      callback();
    },
  });

  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  const answers = [];

  try {
    for (const question of questions) {
      const answer = await new Promise((resolve) => {
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
function askSecrets(questions) {
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
async function askNewPassword() {
  const [password, confirmation] = await askSecrets(['Contraseña: ', 'Repetí la contraseña: ']);

  if (password !== confirmation) {
    throw new Error('Las contraseñas no coinciden.');
  }

  return password ?? '';
}

/**
 * Da de alta un usuario nuevo, con su cuenta.
 *
 * Sin `--invite` se abre una cuenta nueva y el usuario queda su administrador:
 * es el camino de recuperación para dejar lista una instalación vacía. Con
 * `--invite` se suma a la cuenta de ese código y el rol lo decide `--role`.
 */
async function createUserCommand(authService, accountService, args) {
  const email = args[0];
  if (!email || email.startsWith('--')) {
    throw new Error('Indicá el email. Ejemplo: create ana@example.com --account "Mi equipo"');
  }

  const inviteCode = readOption(args, 'invite');
  const account = inviteCode
    ? await accountService.findByInviteCode(inviteCode)
    : await accountService.create(readOption(args, 'account'));
  const role = inviteCode && readOption(args, 'role') !== 'admin' ? 'user' : 'admin';

  const user = await authService.createUser({
    accountId: account.id,
    email,
    password: await askNewPassword(),
    displayName: readOption(args, 'name'),
    role: role,
  });

  console.log(`Usuario «${user.email}» creado con el rol ${user.role} en la cuenta «${account.name}».`);
  if (!inviteCode) {
    console.log(`Código de invitación de la cuenta: ${account.inviteCode}`);
  }
}

/** Cambia la contraseña de un usuario existente y cierra sus sesiones. */
async function changePasswordCommand(authService, args) {
  const email = args[0];
  if (!email) {
    throw new Error('Indicá el email. Ejemplo: password ana@example.com');
  }

  await authService.changePassword(email, await askNewPassword());

  console.log(`Contraseña actualizada. Se cerraron las sesiones abiertas de «${email}».`);
}

/** Habilita o deshabilita el acceso de un usuario. */
async function setStatusCommand(authService, args, status) {
  const email = args[0];
  if (!email) {
    throw new Error('Indicá el email. Ejemplo: disable ana@example.com');
  }

  const user = await authService.setUserStatus(email, status);

  console.log(status === 'disabled'
    ? `Usuario «${user.email}» deshabilitado. Se cerraron sus sesiones abiertas.`
    : `Usuario «${user.email}» habilitado de nuevo.`);
}

/** Borra un usuario junto con sus sesiones. */
async function deleteUserCommand(authService, args) {
  const email = args[0];
  if (!email) {
    throw new Error('Indicá el email. Ejemplo: delete ana@example.com');
  }

  const deleted = await authService.deleteUser(email);

  console.log(deleted
    ? `Usuario «${email}» borrado, junto con sus sesiones.`
    : `No existía el usuario «${email}»; no había nada que borrar.`);
}

/** Lista los usuarios de todas las cuentas, indicando a cuál pertenece cada uno. */
async function listUsersCommand(authService, accountService) {
  const users = await authService.listAllUsers();

  if (users.length === 0) {
    console.log('Todavía no hay usuarios. Creá el primero acá, o registrate en el tablero: quien abre una cuenta queda su administrador.');
    return;
  }

  const accountNamesById = new Map(
    (await accountService.list()).map((account) => [account.id, account.name]),
  );

  for (const user of users) {
    const accountName = accountNamesById.get(user.accountId) ?? '(sin cuenta)';

    console.log(`${user.email}\t${user.role}\t${user.status}\t${accountName}\t${user.displayName}`);
  }
}

/** Lista las cuentas con su código de invitación y su cantidad de miembros. */
async function listAccountsCommand(accountService) {
  const accounts = await accountService.list();

  if (accounts.length === 0) {
    console.log('Todavía no hay cuentas. La primera se crea al registrarse en el tablero o con «create».');
    return;
  }

  for (const account of accounts) {
    const members = account.memberCount === 1 ? '1 miembro' : `${account.memberCount} miembros`;

    console.log(`${account.name}\t${account.inviteCode ?? ''}\t${members}`);
  }
}

async function main() {
  const [command = '', ...args] = process.argv.slice(2);
  const database = createNeonDatabase(config.databaseUrl);

  // El script puede ser lo primero que corra contra una base recién creada.
  await applySchema(database);

  const accountService = createAccountService({ repository: createAccountRepository(database) });
  const authService = createAuthService({
    repository: createAuthRepository(database),
    accountService,
    sessionDurationDays: config.sessionDurationDays,
  });

  try {
    if (command === 'create') {
      await createUserCommand(authService, accountService, args);
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
      await listUsersCommand(authService, accountService);
      return;
    }

    if (command === 'accounts') {
      await listAccountsCommand(accountService);
      return;
    }

    console.log(USAGE);
    process.exitCode = command ? 1 : 0;
  } finally {
    await authService.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

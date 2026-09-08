// 1. Módulos estándar de Node.js.
import { createHash, randomBytes, randomUUID } from 'node:crypto';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService, AuthServiceOptions, CreateUserInput, LoginResult, RegisterUserInput, StoredUser, UserRole, UserStatus, UserSummary } from '../types.js';

import { parseGitlabUsername } from '../utils/gitlabUsername.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

// 6. Utilidades.
import { HttpError } from '../../../shared/httpError.js';

const DEFAULT_SESSION_DURATION_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

// Freno simple de fuerza bruta. Vive en memoria: alcanza para un tablero
// interno y se reinicia con el proceso, que es el peor caso aceptable.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

interface FailedAttempts {
  count: number;
  lockedUntil: number;
}

/** Alta ya validada, con la contraseña derivada y a la espera de una cuenta. */
interface PreparedUser {
  username: string;
  displayName: string;
  passwordHash: string;
}

/** Quita los datos sensibles antes de exponer un usuario. */
function toAuthenticatedUser(user: StoredUser): AuthenticatedUser {
  return {
    id: user.id,
    accountId: user.accountId,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    gitlabUsername: user.gitlabUsername,
  };
}

/** Agrega a la identidad los datos de gestión, sin la contraseña. */
function toUserSummary(user: StoredUser): UserSummary {
  return {
    ...toAuthenticatedUser(user),
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Deriva el identificador con el que se guarda una sesión.
 *
 * @param token Token en claro entregado al navegador.
 * @returns Hash SHA-256 en hexadecimal; es lo único que toca la base.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Normaliza el nombre de usuario para que el login no dependa de mayúsculas. */
function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Arma el servicio de autenticación sobre un repositorio ya abierto.
 *
 * @param options Repositorio, servicio de cuentas, reloj y duración de sesión.
 * @returns Servicio con las operaciones de alta, login y validación de sesión.
 */
function createAuthService(options: AuthServiceOptions): AuthService {
  const {
    repository,
    accountService,
    now = () => new Date(),
    sessionDurationDays = DEFAULT_SESSION_DURATION_DAYS,
  } = options;

  const failedAttemptsByUsername = new Map<string, FailedAttempts>();

  /** Informa cuántos milisegundos falta esperar, o cero si no hay bloqueo. */
  function remainingLockMs(username: string): number {
    const attempts = failedAttemptsByUsername.get(username);
    if (!attempts) return 0;

    return Math.max(0, attempts.lockedUntil - now().getTime());
  }

  /** Suma un intento fallido y bloquea al alcanzar el máximo. */
  function registerFailedAttempt(username: string): void {
    const attempts = failedAttemptsByUsername.get(username) ?? { count: 0, lockedUntil: 0 };
    attempts.count += 1;

    if (attempts.count >= MAX_FAILED_ATTEMPTS) {
      attempts.count = 0;
      attempts.lockedUntil = now().getTime() + LOCK_DURATION_MS;
    }

    failedAttemptsByUsername.set(username, attempts);
  }

  /**
   * Valida un alta y deja la contraseña ya derivada.
   *
   * Se separa del guardado porque el registro necesita rechazar los datos
   * inválidos **antes** de crear la cuenta: si no, un nombre repetido dejaría
   * una cuenta sin nadie adentro.
   *
   * @param input Nombre, contraseña y nombre visible tal como llegaron.
   * @returns Los datos normalizados, con el hash de la contraseña.
   * @throws {HttpError} 400 si el nombre o la contraseña no cumplen las reglas,
   * 409 si el nombre ya está tomado.
   */
  async function prepareNewUser(input: {
    username?: string;
    password?: string;
    displayName?: string;
  }): Promise<PreparedUser> {
    const username = normalizeUsername(input.username ?? '');

    if (!USERNAME_PATTERN.test(username)) {
      throw new HttpError(
        'El nombre de usuario debe tener entre 3 y 32 caracteres y usar sólo letras, números, punto, guion o guion bajo.',
        400,
      );
    }

    // El nombre es único en toda la base, no dentro de la cuenta: el login pide
    // sólo usuario y contraseña, así que no hay con qué desambiguar.
    if (await repository.findUserByUsername(username)) {
      throw new HttpError(`Ya existe un usuario con el nombre «${username}».`, 409);
    }

    return {
      username,
      displayName: input.displayName?.trim() || username,
      passwordHash: await hashNewPassword(input.password ?? ''),
    };
  }

  /**
   * Guarda en una cuenta un alta ya validada.
   *
   * @param prepared Datos que devolvió `prepareNewUser`.
   * @param accountId Cuenta a la que se suma.
   * @param role Rol con el que entra.
   * @returns El usuario persistido, con su hash.
   */
  async function insertPreparedUser(
    prepared: PreparedUser,
    accountId: string,
    role: UserRole,
  ): Promise<StoredUser> {
    const user: StoredUser = {
      id: randomUUID(),
      accountId,
      username: prepared.username,
      displayName: prepared.displayName,
      passwordHash: prepared.passwordHash,
      role,
      status: 'active',
      gitlabUsername: null,
      createdAt: now().toISOString(),
      lastLoginAt: null,
    };

    await repository.insertUser(user);

    return user;
  }

  async function createUser(input: CreateUserInput): Promise<AuthenticatedUser> {
    const prepared = await prepareNewUser(input);

    return toAuthenticatedUser(
      await insertPreparedUser(prepared, input.accountId, input.role ?? 'user'),
    );
  }

  /**
   * Emite una sesión nueva para un usuario ya validado.
   *
   * @param user Usuario al que pertenece la sesión.
   * @returns Identidad, token en claro y fecha de vencimiento.
   */
  async function createSessionFor(user: StoredUser): Promise<LoginResult> {
    const currentDate = now();
    const expiresAt = new Date(currentDate.getTime() + sessionDurationDays * MILLISECONDS_PER_DAY);
    const token = randomBytes(TOKEN_BYTES).toString('base64url');

    await repository.deleteExpiredSessions(currentDate.toISOString());
    await repository.insertSession({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      createdAt: currentDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    await repository.updateLastLogin(user.id, currentDate.toISOString());

    return { user: toAuthenticatedUser(user), token, expiresAt };
  }

  /**
   * Da de alta a alguien por su propia cuenta y le abre la sesión.
   *
   * Con código de invitación se suma a una cuenta que ya existe como `user`;
   * sin él crea una cuenta nueva y queda su administrador, que es lo que
   * permite que un equipo empiece a usar el tablero sin intervención de nadie.
   *
   * @param input Datos del alta, con el código o el nombre de la cuenta.
   * @returns Identidad, token de sesión y vencimiento.
   * @throws {HttpError} 404 si el código de invitación no existe, y lo que
   * arrastre la validación del usuario.
   */
  async function register(input: RegisterUserInput): Promise<LoginResult> {
    // Primero el usuario, después la cuenta: crear la cuenta y recién entonces
    // descubrir que el nombre está tomado dejaría una cuenta vacía.
    const prepared = await prepareNewUser(input);
    const joiningWithCode = Boolean(input.inviteCode?.trim());
    const account = joiningWithCode
      ? await accountService.findByInviteCode(input.inviteCode)
      : await accountService.create(input.accountName);

    const user = await insertPreparedUser(prepared, account.id, joiningWithCode ? 'user' : 'admin');

    // Se abre la sesión en el mismo paso: quien se registra ya probó quién es.
    return await createSessionFor(user);
  }

  async function login(credentials: { username: string; password: string }): Promise<LoginResult> {
    const username = normalizeUsername(credentials.username ?? '');
    const password = credentials.password ?? '';

    if (!username || !password) {
      throw new HttpError('Ingresá tu usuario y tu contraseña.', 400);
    }

    const lockMs = remainingLockMs(username);
    if (lockMs > 0) {
      const minutes = Math.ceil(lockMs / 60_000);
      throw new HttpError(`Demasiados intentos fallidos. Probá de nuevo en ${minutes} minutos.`, 429);
    }

    const user = await repository.findUserByUsername(username);
    const passwordMatches = await matchesStoredPassword(password, user);

    if (!user || !passwordMatches) {
      registerFailedAttempt(username);
      throw new HttpError('Usuario o contraseña incorrectos.', 401);
    }

    if (user.status !== 'active') {
      throw new HttpError('Tu usuario está deshabilitado. Pedile acceso a un administrador.', 403);
    }

    failedAttemptsByUsername.delete(username);

    return await createSessionFor(user);
  }

  async function authenticate(token: string | undefined): Promise<AuthenticatedUser | null> {
    if (!token) return null;

    const session = await repository.findSessionByTokenHash(hashToken(token));
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= now().getTime()) {
      await repository.deleteSession(session.id);
      return null;
    }

    const user = await repository.findUserById(session.userId);
    if (!user || user.status !== 'active') return null;

    return toAuthenticatedUser(user);
  }

  async function logout(token: string | undefined): Promise<void> {
    if (!token) return;

    const session = await repository.findSessionByTokenHash(hashToken(token));
    if (session) await repository.deleteSession(session.id);
  }

  async function changePassword(username: string, newPassword: string): Promise<void> {
    const user = await repository.findUserByUsername(normalizeUsername(username));
    if (!user) {
      throw new HttpError(`No existe el usuario «${username}».`, 404);
    }

    const passwordHash = await hashNewPassword(newPassword);

    await repository.updatePasswordHash(user.id, passwordHash);
    // Cambiar la contraseña invalida lo emitido antes: es la única forma de
    // cortar el acceso de una sesión ya robada.
    await repository.deleteSessionsOfUser(user.id);
    failedAttemptsByUsername.delete(user.username);
  }

  /**
   * Cambia la contraseña de la propia persona, exigiendo la actual.
   *
   * @param username Usuario de la sesión en curso.
   * @param currentPassword Contraseña vigente, para confirmar la identidad.
   * @param newPassword Contraseña nueva.
   * @throws {HttpError} 403 si la contraseña actual no coincide, 404 si el
   * usuario no existe y 400 si la nueva no cumple el largo mínimo.
   */
  async function changeOwnPassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await repository.findUserByUsername(normalizeUsername(username));
    if (!user) {
      throw new HttpError(`No existe el usuario «${username}».`, 404);
    }

    if (!await verifyPassword(currentPassword ?? '', user.passwordHash)) {
      throw new HttpError('La contraseña actual no coincide.', 403);
    }

    await changePassword(user.username, newPassword);
  }

  /**
   * Guarda el nickname de GitLab de la propia persona.
   *
   * Es lo único de GitLab que no es de la cuenta: el token y los proyectos los
   * carga quien administra, pero la identidad con la que cada uno aparece en
   * los merge requests es suya.
   *
   * @param userId Usuario de la sesión en curso.
   * @param gitlabUsername Nickname tal como lo escribió la persona.
   * @returns La identidad ya actualizada.
   * @throws {HttpError} 400 si el nickname no es válido, 404 si el usuario no
   * existe.
   */
  async function changeGitlabUsername(
    userId: string,
    gitlabUsername: unknown,
  ): Promise<AuthenticatedUser> {
    const user = await repository.findUserById(userId);
    if (!user) {
      throw new HttpError('No existe el usuario de la sesión.', 404);
    }

    const parsedUsername = parseGitlabUsername(gitlabUsername);

    await repository.updateGitlabUsername(user.id, parsedUsername);

    return toAuthenticatedUser({ ...user, gitlabUsername: parsedUsername });
  }

  /**
   * Comprueba que un usuario pertenezca a una cuenta.
   *
   * Es lo que impide que quien administra una cuenta toque los usuarios de
   * otra: el nombre es único en toda la base, así que sin este control una
   * ruta de administración alcanzaría a cualquiera.
   *
   * @param accountId Cuenta de quien administra.
   * @param username Nombre del usuario a administrar.
   * @returns El usuario, si es de esa cuenta.
   * @throws {HttpError} 404 si no existe o pertenece a otra cuenta.
   */
  async function requireAccountMember(accountId: string, username: string): Promise<UserSummary> {
    const normalizedUsername = normalizeUsername(username);
    const user = await repository.findUserByUsername(normalizedUsername);

    if (!user || user.accountId !== accountId) {
      throw new HttpError(`No existe el usuario «${normalizedUsername}» en tu cuenta.`, 404);
    }

    return toUserSummary(user);
  }

  /**
   * Habilita o deshabilita un usuario.
   *
   * Deshabilitar corta el acceso de inmediato: además de bloquear el login,
   * se borran las sesiones ya emitidas.
   *
   * @param username Nombre del usuario a modificar.
   * @param status Nuevo estado.
   * @returns El usuario con su estado ya aplicado.
   * @throws {HttpError} 404 si el usuario no existe.
   */
  async function setUserStatus(username: string, status: UserStatus): Promise<UserSummary> {
    const user = await repository.findUserByUsername(normalizeUsername(username));
    if (!user) {
      throw new HttpError(`No existe el usuario «${username}».`, 404);
    }

    await repository.updateStatus(user.id, status);
    if (status === 'disabled') await repository.deleteSessionsOfUser(user.id);

    return toUserSummary({ ...user, status });
  }

  /**
   * Borra un usuario y, en cascada, sus sesiones.
   *
   * No falla si el usuario no existe: quien la usa —la línea de comandos y la
   * preparación de los E2E— quiere dejar la base en un estado, no comprobar
   * que estuviera.
   *
   * @param username Nombre del usuario a borrar.
   * @returns `true` si existía y se borró.
   */
  async function deleteUser(username: string): Promise<boolean> {
    const normalizedUsername = normalizeUsername(username);
    const user = await repository.findUserByUsername(normalizedUsername);
    if (!user) return false;

    failedAttemptsByUsername.delete(normalizedUsername);

    return await repository.deleteUser(user.id);
  }

  async function listUsers(accountId: string): Promise<UserSummary[]> {
    return (await repository.listUsersOfAccount(accountId)).map(toUserSummary);
  }

  async function listAllUsers(): Promise<UserSummary[]> {
    return (await repository.listAllUsers()).map(toUserSummary);
  }

  return {
    authenticate,
    changeGitlabUsername,
    changeOwnPassword,
    changePassword,
    close: () => repository.close(),
    createUser,
    deleteUser,
    listAllUsers,
    listUsers,
    login,
    logout,
    register,
    requireAccountMember,
    setUserStatus,
  };
}

/**
 * Aplica las reglas de contraseña traduciendo el fallo a un error HTTP.
 *
 * @param password Contraseña en texto plano.
 * @returns Hash listo para guardar.
 * @throws {HttpError} 400 si la contraseña no cumple el largo mínimo.
 */
async function hashNewPassword(password: string): Promise<string> {
  try {
    return await hashPassword(password);
  } catch (error: unknown) {
    throw new HttpError(error instanceof Error ? error.message : 'Contraseña inválida.', 400);
  }
}

/**
 * Compara la contraseña contra el usuario encontrado.
 *
 * Cuando el usuario no existe igual se deriva una clave descartable: sin ese
 * trabajo equivalente, el tiempo de respuesta revelaría qué nombres de usuario
 * están dados de alta.
 *
 * @param password Contraseña recibida en el login.
 * @param user Usuario encontrado, o `null` si el nombre no existe.
 * @returns `true` sólo si el usuario existe y la contraseña coincide.
 */
async function matchesStoredPassword(password: string, user: StoredUser | null): Promise<boolean> {
  if (user) return await verifyPassword(password, user.passwordHash);

  await hashPassword(password.padEnd(8, '.')).catch(() => undefined);
  return false;
}

export { createAuthService, normalizeUsername };

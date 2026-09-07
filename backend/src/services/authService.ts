// 1. Módulos estándar de Node.js.
import { createHash, randomBytes, randomUUID } from 'node:crypto';

// 4. Imports exclusivos de tipos de TypeScript.
import type {
  AuthenticatedUser,
  AuthService,
  AuthServiceOptions,
  CreateUserInput,
  LoginResult,
  RegisterUserInput,
  StoredUser,
  UserStatus,
  UserSummary,
} from '../types.js';

// 6. Utilidades.
import { hashPassword, verifyPassword } from '../utils/password.js';

const DEFAULT_SESSION_DURATION_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

// Freno simple de fuerza bruta. Vive en memoria: alcanza para un tablero
// interno y se reinicia con el proceso, que es el peor caso aceptable.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Error de autenticación con el código HTTP que le corresponde. */
class AuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

interface FailedAttempts {
  count: number;
  lockedUntil: number;
}

/** Quita los datos sensibles antes de exponer un usuario. */
function toAuthenticatedUser(user: StoredUser): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
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
 * @param options Repositorio, reloj y duración de sesión inyectables.
 * @returns Servicio con las operaciones de alta, login y validación de sesión.
 */
function createAuthService(options: AuthServiceOptions): AuthService {
  const {
    repository,
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
   * Da de alta un usuario y devuelve la fila ya guardada.
   *
   * @param input Datos del alta; el rol sólo lo elige quien administra.
   * @returns El usuario persistido, con su hash.
   * @throws {AuthError} 400 si el nombre o la contraseña no cumplen las reglas,
   * 409 si el nombre ya está tomado.
   */
  async function insertNewUser(input: CreateUserInput): Promise<StoredUser> {
    const username = normalizeUsername(input.username ?? '');

    if (!USERNAME_PATTERN.test(username)) {
      throw new AuthError(
        'El nombre de usuario debe tener entre 3 y 32 caracteres y usar sólo letras, números, punto, guion o guion bajo.',
        400,
      );
    }

    if (repository.findUserByUsername(username)) {
      throw new AuthError(`Ya existe un usuario con el nombre «${username}».`, 409);
    }

    const passwordHash = await hashNewPassword(input.password ?? '');

    const user: StoredUser = {
      id: randomUUID(),
      username,
      displayName: input.displayName?.trim() || username,
      passwordHash,
      role: input.role ?? 'user',
      status: 'active',
      createdAt: now().toISOString(),
      lastLoginAt: null,
    };

    repository.insertUser(user);

    return user;
  }

  async function createUser(input: CreateUserInput): Promise<AuthenticatedUser> {
    return toAuthenticatedUser(await insertNewUser(input));
  }

  /**
   * Emite una sesión nueva para un usuario ya validado.
   *
   * @param user Usuario al que pertenece la sesión.
   * @returns Identidad, token en claro y fecha de vencimiento.
   */
  function createSessionFor(user: StoredUser): LoginResult {
    const currentDate = now();
    const expiresAt = new Date(currentDate.getTime() + sessionDurationDays * MILLISECONDS_PER_DAY);
    const token = randomBytes(TOKEN_BYTES).toString('base64url');

    repository.deleteExpiredSessions(currentDate.toISOString());
    repository.insertSession({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      createdAt: currentDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    repository.updateLastLogin(user.id, currentDate.toISOString());

    return { user: toAuthenticatedUser(user), token, expiresAt };
  }

  async function register(input: RegisterUserInput): Promise<LoginResult> {
    // El primer usuario del sistema queda administrador: sin eso nadie podría
    // entrar a la pantalla de usuarios sin pasar por la línea de comandos.
    const role = repository.countUsers() === 0 ? 'admin' : 'user';
    const user = await insertNewUser({ ...input, role });

    // Se abre la sesión en el mismo paso: quien se registra ya probó quién es.
    return createSessionFor(user);
  }

  async function login(credentials: { username: string; password: string }): Promise<LoginResult> {
    const username = normalizeUsername(credentials.username ?? '');
    const password = credentials.password ?? '';

    if (!username || !password) {
      throw new AuthError('Ingresá tu usuario y tu contraseña.', 400);
    }

    const lockMs = remainingLockMs(username);
    if (lockMs > 0) {
      const minutes = Math.ceil(lockMs / 60_000);
      throw new AuthError(`Demasiados intentos fallidos. Probá de nuevo en ${minutes} minutos.`, 429);
    }

    const user = repository.findUserByUsername(username);
    const passwordMatches = await matchesStoredPassword(password, user);

    if (!user || !passwordMatches) {
      registerFailedAttempt(username);
      throw new AuthError('Usuario o contraseña incorrectos.', 401);
    }

    if (user.status !== 'active') {
      throw new AuthError('Tu usuario está deshabilitado. Pedile acceso a un administrador.', 403);
    }

    failedAttemptsByUsername.delete(username);

    return createSessionFor(user);
  }

  function authenticate(token: string | undefined): AuthenticatedUser | null {
    if (!token) return null;

    const session = repository.findSessionByTokenHash(hashToken(token));
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= now().getTime()) {
      repository.deleteSession(session.id);
      return null;
    }

    const user = repository.findUserById(session.userId);
    if (!user || user.status !== 'active') return null;

    return toAuthenticatedUser(user);
  }

  function logout(token: string | undefined): void {
    if (!token) return;

    const session = repository.findSessionByTokenHash(hashToken(token));
    if (session) repository.deleteSession(session.id);
  }

  async function changePassword(username: string, newPassword: string): Promise<void> {
    const user = repository.findUserByUsername(normalizeUsername(username));
    if (!user) {
      throw new AuthError(`No existe el usuario «${username}».`, 404);
    }

    const passwordHash = await hashNewPassword(newPassword);

    repository.updatePasswordHash(user.id, passwordHash);
    // Cambiar la contraseña invalida lo emitido antes: es la única forma de
    // cortar el acceso de una sesión ya robada.
    repository.deleteSessionsOfUser(user.id);
    failedAttemptsByUsername.delete(user.username);
  }

  /**
   * Cambia la contraseña de la propia persona, exigiendo la actual.
   *
   * @param username Usuario de la sesión en curso.
   * @param currentPassword Contraseña vigente, para confirmar la identidad.
   * @param newPassword Contraseña nueva.
   * @throws {AuthError} 403 si la contraseña actual no coincide, 404 si el
   * usuario no existe y 400 si la nueva no cumple el largo mínimo.
   */
  async function changeOwnPassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = repository.findUserByUsername(normalizeUsername(username));
    if (!user) {
      throw new AuthError(`No existe el usuario «${username}».`, 404);
    }

    if (!await verifyPassword(currentPassword ?? '', user.passwordHash)) {
      throw new AuthError('La contraseña actual no coincide.', 403);
    }

    await changePassword(user.username, newPassword);
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
   * @throws {AuthError} 404 si el usuario no existe.
   */
  function setUserStatus(username: string, status: UserStatus): UserSummary {
    const user = repository.findUserByUsername(normalizeUsername(username));
    if (!user) {
      throw new AuthError(`No existe el usuario «${username}».`, 404);
    }

    repository.updateStatus(user.id, status);
    if (status === 'disabled') repository.deleteSessionsOfUser(user.id);

    return toUserSummary({ ...user, status });
  }

  function listUsers(): UserSummary[] {
    return repository.listUsers().map(toUserSummary);
  }

  return {
    authenticate,
    changeOwnPassword,
    changePassword,
    close: () => repository.close(),
    createUser,
    listUsers,
    login,
    logout,
    register,
    setUserStatus,
  };
}

/**
 * Aplica las reglas de contraseña traduciendo el fallo a un error HTTP.
 *
 * @param password Contraseña en texto plano.
 * @returns Hash listo para guardar.
 * @throws {AuthError} 400 si la contraseña no cumple el largo mínimo.
 */
async function hashNewPassword(password: string): Promise<string> {
  try {
    return await hashPassword(password);
  } catch (error: unknown) {
    throw new AuthError(error instanceof Error ? error.message : 'Contraseña inválida.', 400);
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

export { AuthError, createAuthService, normalizeUsername };

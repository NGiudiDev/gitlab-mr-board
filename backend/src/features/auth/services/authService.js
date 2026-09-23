import { createHash, randomBytes, randomUUID } from "node:crypto";

import { HttpError } from "../../../shared/httpError.js";
import { normalizeEmail, toAuthenticatedUser } from "../../users/services/userService.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const DEFAULT_SESSION_DURATION_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const TOKEN_BYTES = 32;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Deriva el identificador con el que se guarda una sesión. */
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/** Aplica las reglas de contraseña traduciendo el fallo a un error HTTP. */
async function hashNewPassword(password) {
  try {
    return await hashPassword(password);
  } catch (error) {
    throw new HttpError(error instanceof Error ? error.message : "Contraseña inválida.", 400);
  }
}

/**
 * Compara una contraseña sin revelar por tiempo de respuesta si el email existe.
 *
 * @param password Contraseña recibida en el login.
 * @param user Usuario encontrado, o `null`.
 * @returns `true` sólo si el usuario existe y la contraseña coincide.
 */
async function matchesStoredPassword(password, user) {
  if (user) return await verifyPassword(password, user.passwordHash);

  await hashPassword(password.padEnd(8, ".")).catch(() => undefined);
  return false;
}

/**
 * Arma el servicio de autenticación.
 *
 * Se limita al registro de cuentas, login, sesiones y contraseñas. El perfil
 * y la administración de personas pertenecen a `features/users`.
 *
 * @param options Repositorio de sesiones, servicios relacionados y reloj.
 * @returns Servicio de autenticación listo para usar.
 */
function createAuthService(options) {
  const {
    repository,
    userService,
    accountService,
    now = () => new Date(),
    sessionDurationDays = DEFAULT_SESSION_DURATION_DAYS,
  } = options;

  const failedAttemptsByEmail = new Map();

  function remainingLockMs(email) {
    const attempts = failedAttemptsByEmail.get(email);
    if (!attempts) return 0;

    return Math.max(0, attempts.lockedUntil - now().getTime());
  }

  function registerFailedAttempt(email) {
    const attempts = failedAttemptsByEmail.get(email) ?? { count: 0, lockedUntil: 0 };
    attempts.count += 1;

    if (attempts.count >= MAX_FAILED_ATTEMPTS) {
      attempts.count = 0;
      attempts.lockedUntil = now().getTime() + LOCK_DURATION_MS;
    }

    failedAttemptsByEmail.set(email, attempts);
  }

  async function createSessionFor(user) {
    const currentDate = now();
    const expiresAt = new Date(currentDate.getTime() + sessionDurationDays * MILLISECONDS_PER_DAY);
    const token = randomBytes(TOKEN_BYTES).toString("base64url");

    await repository.deleteExpiredSessions(currentDate.toISOString());
    await repository.insertSession({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      createdAt: currentDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    await userService.updateLastLogin(user.id, currentDate.toISOString());

    return { user: toAuthenticatedUser(user), token, expiresAt };
  }

  async function register(input) {
    // El usuario se valida antes de crear la cuenta para no dejar cuentas vacías.
    const prepared = await userService.prepareNewUser(input);
    const joiningWithCode = Boolean(input.inviteCode?.trim());
    const account = joiningWithCode
      ? await accountService.findByInviteCode(input.inviteCode)
      : await accountService.create(input.accountName);

    await userService.createPreparedUser(
      prepared,
      account.id,
      joiningWithCode ? "user" : "admin",
    );
    const user = await userService.findByEmail(prepared.email);

    return await createSessionFor(user);
  }

  async function login(credentials) {
    const email = normalizeEmail(credentials.email ?? "");
    const password = credentials.password ?? "";

    if (!email || !password) {
      throw new HttpError("Ingresá tu email y tu contraseña.", 400);
    }

    const lockMs = remainingLockMs(email);
    if (lockMs > 0) {
      const minutes = Math.ceil(lockMs / 60_000);
      throw new HttpError(`Demasiados intentos fallidos. Probá de nuevo en ${minutes} minutos.`, 429);
    }

    const user = await userService.findByEmail(email);
    const passwordMatches = await matchesStoredPassword(password, user);

    if (!user || !passwordMatches) {
      registerFailedAttempt(email);
      throw new HttpError("Email o contraseña incorrectos.", 401);
    }

    if (user.status !== "active") {
      throw new HttpError("Tu usuario está deshabilitado. Pedile acceso a un administrador.", 403);
    }

    failedAttemptsByEmail.delete(email);
    return await createSessionFor(user);
  }

  async function authenticate(token) {
    if (!token) return null;

    const session = await repository.findSessionByTokenHash(hashToken(token));
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= now().getTime()) {
      await repository.deleteSession(session.id);
      return null;
    }

    const user = await userService.findById(session.userId);
    if (!user || user.status !== "active") return null;

    return toAuthenticatedUser(user);
  }

  async function logout(token) {
    if (!token) return;

    const session = await repository.findSessionByTokenHash(hashToken(token));
    if (session) await repository.deleteSession(session.id);
  }

  async function changePassword(email, newPassword) {
    const user = await userService.findByEmail(email);
    if (!user) throw new HttpError(`No existe el usuario con email «${email}».`, 404);

    await userService.setPasswordHash(user.id, await hashNewPassword(newPassword));
    await repository.deleteSessionsOfUser(user.id);
    failedAttemptsByEmail.delete(user.email);
  }

  async function changeOwnPassword(email, currentPassword, newPassword) {
    const user = await userService.findByEmail(email);
    if (!user) throw new HttpError(`No existe el usuario con email «${email}».`, 404);

    if (!await verifyPassword(currentPassword ?? "", user.passwordHash)) {
      throw new HttpError("La contraseña actual no coincide.", 403);
    }

    await changePassword(user.email, newPassword);
  }

  return {
    authenticate,
    changeOwnPassword,
    changePassword,
    close: () => repository.close(),
    login,
    logout,
    register,
  };
}

export { createAuthService };

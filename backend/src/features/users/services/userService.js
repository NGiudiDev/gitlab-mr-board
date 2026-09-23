import { randomUUID } from "node:crypto";

import { hashPassword } from "../../auth/utils/password.js";
import { HttpError } from "../../../shared/httpError.js";
import { parseGitlabUsername } from "../utils/gitlabUsername.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAXIMUM_EMAIL_LENGTH = 254;

/** Quita los datos sensibles antes de exponer un usuario. */
function toAuthenticatedUser(user) {
  return {
    id: user.id,
    accountId: user.accountId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    gitlabUsername: user.gitlabUsername,
  };
}

/** Agrega a la identidad los datos de gestión, sin la contraseña. */
function toUserSummary(user) {
  return {
    ...toAuthenticatedUser(user),
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/** Normaliza el email para que la identidad no dependa de mayúsculas. */
function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/**
 * Normaliza y valida el identificador del usuario.
 *
 * @param email Email tal como llegó del cliente.
 * @returns Email listo para persistir.
 * @throws {HttpError} 400 si no cumple el formato admitido.
 */
function parseEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail.length > MAXIMUM_EMAIL_LENGTH || !EMAIL_PATTERN.test(normalizedEmail)) {
    throw new HttpError("Ingresá un email válido.", 400);
  }

  return normalizedEmail;
}

/** Limpia el nombre mostrado y usa el email cuando queda vacío. */
function parseDisplayName(displayName, fallback) {
  if (displayName === undefined) return fallback;
  if (typeof displayName !== "string") {
    throw new HttpError("El nombre visible debe ser texto.", 400);
  }

  return displayName.trim() || fallback;
}

/** Aplica las reglas de contraseña y traduce sus errores al contrato HTTP. */
async function hashInitialPassword(password) {
  try {
    return await hashPassword(password);
  } catch (error) {
    throw new HttpError(error instanceof Error ? error.message : "Contraseña inválida.", 400);
  }
}

/**
 * Arma las reglas de usuarios sobre su repositorio.
 *
 * @param options Repositorio, reloj e invalidación de sesiones.
 * @returns Servicio de alta, perfil y administración de usuarios.
 */
function createUserService(options) {
  const {
    repository,
    now = () => new Date(),
    invalidateSessions = async () => {},
  } = options;

  /** Valida un alta antes de que el flujo de registro cree una cuenta. */
  async function prepareNewUser(input) {
    const email = parseEmail(input.email);

    if (await repository.findUserByEmail(email)) {
      throw new HttpError(`Ya existe un usuario con el email «${email}».`, 409);
    }

    return {
      email,
      displayName: parseDisplayName(input.displayName, email),
      passwordHash: await hashInitialPassword(input.password ?? ""),
    };
  }

  /** Persiste un alta que ya fue validada. */
  async function createPreparedUser(prepared, accountId, role = "user") {
    const user = {
      id: randomUUID(),
      accountId,
      email: prepared.email,
      displayName: prepared.displayName,
      passwordHash: prepared.passwordHash,
      role,
      status: "active",
      gitlabUsername: null,
      createdAt: now().toISOString(),
      lastLoginAt: null,
    };

    await repository.insertUser(user);
    return toAuthenticatedUser(user);
  }

  async function createUser(input) {
    const prepared = await prepareNewUser(input);

    return await createPreparedUser(prepared, input.accountId, input.role ?? "user");
  }

  async function changeGitlabUsername(userId, gitlabUsername) {
    const user = await repository.findUserById(userId);
    if (!user) throw new HttpError("No existe el usuario de la sesión.", 404);

    const parsedUsername = parseGitlabUsername(gitlabUsername);
    await repository.updateGitlabUsername(user.id, parsedUsername);

    return toAuthenticatedUser({ ...user, gitlabUsername: parsedUsername });
  }

  async function changeOwnProfile(userId, input) {
    const user = await repository.findUserById(userId);
    if (!user) throw new HttpError("No existe el usuario de la sesión.", 404);

    const email = input.email === undefined ? user.email : parseEmail(input.email);
    const displayName = input.displayName === undefined
      ? user.displayName
      : parseDisplayName(input.displayName, email);

    if (email !== user.email && await repository.findUserByEmail(email)) {
      throw new HttpError(`Ya existe un usuario con el email «${email}».`, 409);
    }

    await repository.updateProfile(user.id, email, displayName);
    return toAuthenticatedUser({ ...user, email, displayName });
  }

  async function requireAccountMember(accountId, email) {
    const normalizedEmail = normalizeEmail(email);
    const user = await repository.findUserByEmail(normalizedEmail);

    if (!user || user.accountId !== accountId) {
      throw new HttpError(`No existe el usuario con email «${normalizedEmail}» en tu cuenta.`, 404);
    }

    return toUserSummary(user);
  }

  async function setUserStatus(email, status) {
    const user = await repository.findUserByEmail(normalizeEmail(email));
    if (!user) throw new HttpError(`No existe el usuario con email «${email}».`, 404);

    await repository.updateStatus(user.id, status);
    if (status === "disabled") await invalidateSessions(user.id);

    return toUserSummary({ ...user, status });
  }

  async function deleteUser(email) {
    const normalizedEmail = normalizeEmail(email);
    const user = await repository.findUserByEmail(normalizedEmail);
    if (!user) return false;

    return await repository.deleteUser(user.id);
  }

  return {
    changeGitlabUsername,
    changeOwnProfile,
    createPreparedUser,
    createUser,
    deleteUser,
    findByEmail: (email) => repository.findUserByEmail(normalizeEmail(email)),
    findById: (id) => repository.findUserById(id),
    listAllUsers: async () => (await repository.listAllUsers()).map(toUserSummary),
    listUsers: async (accountId) => (await repository.listUsersOfAccount(accountId)).map(toUserSummary),
    prepareNewUser,
    requireAccountMember,
    setPasswordHash: (userId, passwordHash) => repository.updatePasswordHash(userId, passwordHash),
    setUserStatus,
    updateLastLogin: (userId, lastLoginAt) => repository.updateLastLogin(userId, lastLoginAt),
  };
}

export { createUserService, normalizeEmail, toAuthenticatedUser };

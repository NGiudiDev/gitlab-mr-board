import express from "express";

import { parseCookieHeader } from "../utils/cookies.js";

import config from "../../../config.js";
import { respondWithHttpError } from "../../../shared/httpError.js";

const SESSION_COOKIE_NAME = "mr_board_session";

// El registro es público, así que necesita su propio freno: sin él, cualquiera
// podría llenar la base de usuarios. El conteo vive en memoria del proceso.
const MAX_REGISTRATIONS_PER_WINDOW = 5;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;
const MAX_PASSWORD_RESET_REQUESTS_PER_WINDOW = 5;
const PASSWORD_RESET_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const PASSWORD_RESET_REQUESTED_MESSAGE = "Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña.";

/** Descarta eventos viejos y avisa si el origen llegó al límite. */
function requestLimitReached(eventsByAddress, address, windowMs, maximum) {
  const limit = Date.now() - windowMs;
  const recent = (eventsByAddress.get(address) ?? []).filter((at) => at > limit);

  eventsByAddress.set(address, recent);

  return recent.length >= maximum;
}

/**
 * Opciones de la cookie de sesión.
 *
 * `httpOnly` la deja fuera del alcance de JavaScript, así un XSS no puede
 * robar el token; `sameSite: lax` corta el envío desde sitios de terceros.
 */
function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

/** Lee el token de sesión que viaja en la cookie. */
function readSessionToken(cookieHeader) {
  return parseCookieHeader(cookieHeader)[SESSION_COOKIE_NAME];
}

/**
 * Crea el middleware que exige una sesión válida.
 *
 * Deja el usuario en `response.locals.user` para que las rutas protegidas lo
 * usen sin volver a consultar la base.
 *
 * @param authService Servicio que valida el token de sesión.
 * @returns Middleware de Express que responde 401 si no hay sesión.
 */
function createRequireSession(authService) {
  return async (request, response, next) => {
    // Validar la sesión ahora consulta una base remota, así que un fallo de red
    // no debe confundirse con una sesión inválida: eso desloguearía a todo el
    // mundo ante una caída pasajera de la base.
    let user;

    try {
      user = await authService.authenticate(readSessionToken(request.headers.cookie));
    } catch (error) {
      console.error("Error al validar la sesión:", error);
      response.status(503).json({ error: "No se pudo validar tu sesión. Probá de nuevo." });
      return;
    }

    if (!user) {
      response.status(401).json({ error: "Iniciá sesión para ver el tablero." });
      return;
    }

    response.locals.user = user;
    next();
  };
}

/**
 * Crea el middleware que además exige rol de administrador.
 *
 * @param authService Servicio que valida el token de sesión.
 * @returns Middleware que responde 401 sin sesión y 403 sin permisos.
 */
function createRequireAdmin(authService) {
  return [
    createRequireSession(authService),
    (_request, response, next) => {
      const user = response.locals.user;

      if (user.role !== "admin") {
        response.status(403).json({ error: "Necesitás permisos de administrador." });
        return;
      }

      next();
    },
  ];
}

/**
 * Crea el router de sesión: registro, login, recuperación, logout, usuario
 * actual y cambio de la propia contraseña.
 *
 * @param authService Servicio de autenticación ya construido.
 * @returns Router para montar bajo `/api/auth`.
 */
function createAuthRouter(authService) {
  const router = express.Router();
  const registrationsByAddress = new Map();
  const passwordResetRequestsByAddress = new Map();

  /** Descarta los registros viejos y avisa si el origen llegó al límite. */
  function registrationLimitReached(address) {
    return requestLimitReached(
      registrationsByAddress,
      address,
      REGISTRATION_WINDOW_MS,
      MAX_REGISTRATIONS_PER_WINDOW,
    );
  }

  router.post("/register", async (request, response) => {
    const address = request.ip ?? "desconocido";

    if (registrationLimitReached(address)) {
      response.status(429).json({ error: "Se hicieron demasiados registros. Probá de nuevo más tarde." });
      return;
    }

    const { email, password, displayName, accountName, inviteCode } = request.body ?? {};

    try {
      // El código y el nombre de la cuenta se pasan tal como llegaron: es el
      // servicio el que decide si el alta se suma a una cuenta o crea una.
      const result = await authService.register({
        email: email ?? "",
        password: password ?? "",
        ...(displayName === undefined ? {} : { displayName }),
        ...(accountName === undefined ? {} : { accountName }),
        ...(inviteCode === undefined ? {} : { inviteCode }),
      });

      registrationsByAddress.get(address)?.push(Date.now());
      response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
      response.status(201).json({ user: result.user });
    } catch (error) {
      respondWithHttpError(response, error, "al registrar un usuario");
    }
  });

  router.post("/login", async (request, response) => {
    const { email, password } = request.body ?? {};

    try {
      const result = await authService.login({ email: email ?? "", password: password ?? "" });

      response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
      response.json({ user: result.user });
    } catch (error) {
      respondWithHttpError(response, error, "al iniciar sesión");
    }
  });

  router.post("/password-reset-requests", async (request, response) => {
    const address = request.ip ?? "desconocido";

    if (requestLimitReached(
      passwordResetRequestsByAddress,
      address,
      PASSWORD_RESET_REQUEST_WINDOW_MS,
      MAX_PASSWORD_RESET_REQUESTS_PER_WINDOW,
    )) {
      response.status(429).json({ error: "Se solicitaron demasiados enlaces. Probá de nuevo más tarde." });
      return;
    }

    try {
      await authService.requestPasswordReset(request.body?.email ?? "");
      passwordResetRequestsByAddress.get(address)?.push(Date.now());
      response.status(202).json({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
    } catch (error) {
      respondWithHttpError(response, error, "al solicitar un restablecimiento de contraseña");
    }
  });

  router.post("/password-resets", async (request, response) => {
    const { token, newPassword } = request.body ?? {};

    try {
      await authService.resetPassword(token ?? "", newPassword ?? "");
      response.status(204).end();
    } catch (error) {
      respondWithHttpError(response, error, "al restablecer la contraseña");
    }
  });

  router.post("/logout", async (request, response) => {
    try {
      await authService.logout(readSessionToken(request.headers.cookie));
    } catch (error) {
      // La cookie se limpia igual: dejarla viva sería peor, y el token vence solo.
      console.error("Error al cerrar la sesión:", error);
    }

    response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    response.status(204).end();
  });

  router.get("/me", createRequireSession(authService), (_request, response) => {
    response.json({ user: response.locals.user });
  });

  router.put("/password", createRequireSession(authService), async (request, response) => {
    const user = response.locals.user;
    const { currentPassword, newPassword } = request.body ?? {};

    try {
      await authService.changeOwnPassword(user.email, currentPassword ?? "", newPassword ?? "");

      // Cambiar la contraseña cierra todas las sesiones, incluida esta.
      response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
      response.status(204).end();
    } catch (error) {
      respondWithHttpError(response, error, "al cambiar la contraseña");
    }
  });

  return router;
}

export {
  createAuthRouter,
  createRequireAdmin,
  createRequireSession,
  SESSION_COOKIE_NAME,
};

// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService } from '../types.js';
import type { CookieOptions, RequestHandler, Response, Router } from 'express';

// 6. Utilidades.
import { parseCookieHeader } from '../utils/cookies.js';

// 7. Imports relativos restantes.
import config from '../config.js';
import { AuthError } from '../services/authService.js';

const SESSION_COOKIE_NAME = 'mr_board_session';

// El registro es público, así que necesita su propio freno: sin él, cualquiera
// podría llenar la base de usuarios. El conteo vive en memoria del proceso.
const MAX_REGISTRATIONS_PER_WINDOW = 5;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;

/**
 * Opciones de la cookie de sesión.
 *
 * `httpOnly` la deja fuera del alcance de JavaScript, así un XSS no puede
 * robar el token; `sameSite: lax` corta el envío desde sitios de terceros.
 */
function sessionCookieOptions(expiresAt?: Date): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

/** Lee el token de sesión que viaja en la cookie. */
function readSessionToken(cookieHeader: string | undefined): string | undefined {
  return parseCookieHeader(cookieHeader)[SESSION_COOKIE_NAME];
}

/**
 * Traduce cualquier fallo de autenticación a una respuesta HTTP.
 *
 * @param response Respuesta de Express en curso.
 * @param error Error capturado; sólo los `AuthError` conservan su código.
 * @param context Descripción de la operación para el log del servidor.
 */
function respondWithAuthError(response: Response, error: unknown, context: string): void {
  if (error instanceof AuthError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  console.error(`Error inesperado ${context}:`, error);
  response.status(500).json({ error: 'Error interno del servidor.' });
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
function createRequireSession(authService: AuthService): RequestHandler {
  return async (request, response, next) => {
    // Validar la sesión ahora consulta una base remota, así que un fallo de red
    // no debe confundirse con una sesión inválida: eso desloguearía a todo el
    // mundo ante una caída pasajera de la base.
    let user: AuthenticatedUser | null;

    try {
      user = await authService.authenticate(readSessionToken(request.headers.cookie));
    } catch (error: unknown) {
      console.error('Error al validar la sesión:', error);
      response.status(503).json({ error: 'No se pudo validar tu sesión. Probá de nuevo.' });
      return;
    }

    if (!user) {
      response.status(401).json({ error: 'Iniciá sesión para ver el tablero.' });
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
function createRequireAdmin(authService: AuthService): RequestHandler[] {
  return [
    createRequireSession(authService),
    (_request, response, next) => {
      const user = response.locals.user as AuthenticatedUser;

      if (user.role !== 'admin') {
        response.status(403).json({ error: 'Necesitás permisos de administrador.' });
        return;
      }

      next();
    },
  ];
}

/**
 * Crea el router de sesión: registro, login, logout, usuario actual y cambio
 * de la propia contraseña.
 *
 * @param authService Servicio de autenticación ya construido.
 * @returns Router para montar bajo `/api/auth`.
 */
function createAuthRouter(authService: AuthService): Router {
  const router = express.Router();
  const registrationsByAddress = new Map<string, number[]>();

  /** Descarta los registros viejos y avisa si el origen llegó al límite. */
  function registrationLimitReached(address: string): boolean {
    const limit = Date.now() - REGISTRATION_WINDOW_MS;
    const recent = (registrationsByAddress.get(address) ?? []).filter((at) => at > limit);

    registrationsByAddress.set(address, recent);

    return recent.length >= MAX_REGISTRATIONS_PER_WINDOW;
  }

  router.post('/register', async (request, response) => {
    const address = request.ip ?? 'desconocido';

    if (registrationLimitReached(address)) {
      response.status(429).json({ error: 'Se hicieron demasiados registros. Probá de nuevo más tarde.' });
      return;
    }

    const { username, password, displayName } = (request.body ?? {}) as Partial<Record<string, string>>;

    try {
      const result = await authService.register({
        username: username ?? '',
        password: password ?? '',
        ...(displayName === undefined ? {} : { displayName }),
      });

      registrationsByAddress.get(address)?.push(Date.now());
      response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
      response.status(201).json({ user: result.user });
    } catch (error: unknown) {
      respondWithAuthError(response, error, 'al registrar un usuario');
    }
  });

  router.post('/login', async (request, response) => {
    const { username, password } = (request.body ?? {}) as Partial<Record<string, string>>;

    try {
      const result = await authService.login({ username: username ?? '', password: password ?? '' });

      response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
      response.json({ user: result.user });
    } catch (error: unknown) {
      respondWithAuthError(response, error, 'al iniciar sesión');
    }
  });

  router.post('/logout', async (request, response) => {
    try {
      await authService.logout(readSessionToken(request.headers.cookie));
    } catch (error: unknown) {
      // La cookie se limpia igual: dejarla viva sería peor, y el token vence solo.
      console.error('Error al cerrar la sesión:', error);
    }

    response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    response.status(204).end();
  });

  router.get('/me', createRequireSession(authService), (_request, response) => {
    response.json({ user: response.locals.user as AuthenticatedUser });
  });

  router.put('/password', createRequireSession(authService), async (request, response) => {
    const user = response.locals.user as AuthenticatedUser;
    const { currentPassword, newPassword } = (request.body ?? {}) as Partial<Record<string, string>>;

    try {
      await authService.changeOwnPassword(user.username, currentPassword ?? '', newPassword ?? '');

      // Cambiar la contraseña cierra todas las sesiones, incluida esta.
      response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
      response.status(204).end();
    } catch (error: unknown) {
      respondWithAuthError(response, error, 'al cambiar la contraseña');
    }
  });

  return router;
}

export {
  createAuthRouter,
  createRequireAdmin,
  createRequireSession,
  respondWithAuthError,
  SESSION_COOKIE_NAME,
};

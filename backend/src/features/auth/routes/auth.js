// 2. Dependencias externas.
import express from 'express';

// 5. Utilidades.
import { parseCookieHeader } from '../utils/cookies.js';

// 6. Imports relativos restantes.
import config from '../../../config.js';
import { respondWithHttpError } from '../../../shared/httpError.js';

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
function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
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
function createRequireAdmin(authService) {
  return [
    createRequireSession(authService),
    (_request, response, next) => {
      const user = response.locals.user;

      if (user.role !== 'admin') {
        response.status(403).json({ error: 'Necesitás permisos de administrador.' });
        return;
      }

      next();
    },
  ];
}

/**
 * Crea el router de sesión: registro, login, logout, usuario actual y cambios
 * del propio perfil y la contraseña.
 *
 * @param authService Servicio de autenticación ya construido.
 * @returns Router para montar bajo `/api/auth`.
 */
function createAuthRouter(authService) {
  const router = express.Router();
  const registrationsByAddress = new Map();

  /** Descarta los registros viejos y avisa si el origen llegó al límite. */
  function registrationLimitReached(address) {
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

    const { username, password, displayName, accountName, inviteCode } = request.body ?? {};

    try {
      // El código y el nombre de la cuenta se pasan tal como llegaron: es el
      // servicio el que decide si el alta se suma a una cuenta o crea una.
      const result = await authService.register({
        username: username ?? '',
        password: password ?? '',
        ...(displayName === undefined ? {} : { displayName }),
        ...(accountName === undefined ? {} : { accountName }),
        ...(inviteCode === undefined ? {} : { inviteCode }),
      });

      registrationsByAddress.get(address)?.push(Date.now());
      response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
      response.status(201).json({ user: result.user });
    } catch (error) {
      respondWithHttpError(response, error, 'al registrar un usuario');
    }
  });

  router.post('/login', async (request, response) => {
    const { username, password } = request.body ?? {};

    try {
      const result = await authService.login({ username: username ?? '', password: password ?? '' });

      response.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions(result.expiresAt));
      response.json({ user: result.user });
    } catch (error) {
      respondWithHttpError(response, error, 'al iniciar sesión');
    }
  });

  router.post('/logout', async (request, response) => {
    try {
      await authService.logout(readSessionToken(request.headers.cookie));
    } catch (error) {
      // La cookie se limpia igual: dejarla viva sería peor, y el token vence solo.
      console.error('Error al cerrar la sesión:', error);
    }

    response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    response.status(204).end();
  });

  router.get('/me', createRequireSession(authService), (_request, response) => {
    response.json({ user: response.locals.user });
  });

  router.patch('/profile', createRequireSession(authService), async (request, response) => {
    const user = response.locals.user;
    const { username, displayName } = request.body ?? {};

    try {
      response.json({
        user: await authService.changeOwnProfile(user.id, {
          ...(username === undefined ? {} : { username }),
          ...(displayName === undefined ? {} : { displayName }),
        }),
      });
    } catch (error) {
      respondWithHttpError(response, error, 'al guardar el perfil');
    }
  });

  router.put('/gitlab-username', createRequireSession(authService), async (request, response) => {
    const user = response.locals.user;
    const { gitlabUsername } = request.body ?? {};

    try {
      response.json({ user: await authService.changeGitlabUsername(user.id, gitlabUsername) });
    } catch (error) {
      respondWithHttpError(response, error, 'al guardar el nickname de GitLab');
    }
  });

  router.put('/password', createRequireSession(authService), async (request, response) => {
    const user = response.locals.user;
    const { currentPassword, newPassword } = request.body ?? {};

    try {
      await authService.changeOwnPassword(user.username, currentPassword ?? '', newPassword ?? '');

      // Cambiar la contraseña cierra todas las sesiones, incluida esta.
      response.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
      response.status(204).end();
    } catch (error) {
      respondWithHttpError(response, error, 'al cambiar la contraseña');
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

// 2. Dependencias externas.
import express from 'express';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedUser, AuthService, UserRole, UserStatus } from '../types.js';
import type { Router } from 'express';

// 7. Imports relativos restantes.
import { HttpError, respondWithHttpError } from '../../../shared/httpError.js';
import { normalizeUsername } from '../services/authService.js';
import { createRequireAdmin } from './auth.js';

const VALID_STATUSES: UserStatus[] = ['active', 'disabled'];

/**
 * Crea el router de administración de usuarios.
 *
 * Todas sus rutas exigen rol de administrador: el alta pública vive en
 * `/api/auth/register` y no permite elegir rol.
 *
 * @param authService Servicio de autenticación ya construido.
 * @returns Router para montar bajo `/api/users`.
 */
function createUsersRouter(authService: AuthService): Router {
  const router = express.Router();

  router.use(createRequireAdmin(authService));

  router.get('/', async (_request, response) => {
    try {
      response.json({ users: await authService.listUsers() });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al listar los usuarios');
    }
  });

  router.post('/', async (request, response) => {
    const { username, password, displayName, role } = (request.body ?? {}) as Partial<Record<string, string>>;

    try {
      const user = await authService.createUser({
        username: username ?? '',
        password: password ?? '',
        ...(displayName === undefined ? {} : { displayName }),
        role: role === 'admin' ? 'admin' : ('user' as UserRole),
      });

      response.status(201).json({ user });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al crear un usuario');
    }
  });

  router.patch('/:username/status', async (request, response) => {
    const { username = '' } = request.params;
    const { status } = (request.body ?? {}) as Partial<Record<string, string>>;
    const currentUser = response.locals.user as AuthenticatedUser;

    try {
      if (!VALID_STATUSES.includes(status as UserStatus)) {
        throw new HttpError('El estado debe ser «active» o «disabled».', 400);
      }

      // Deshabilitarse a sí mismo dejaría el tablero sin administrador si es
      // el único, y en cualquier caso cerraría la sesión en curso.
      if (normalizeUsername(username) === currentUser.username) {
        throw new HttpError('No podés cambiar el estado de tu propio usuario.', 409);
      }

      response.json({ user: await authService.setUserStatus(username, status as UserStatus) });
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al cambiar el estado de un usuario');
    }
  });

  router.put('/:username/password', async (request, response) => {
    const { username = '' } = request.params;
    const { password } = (request.body ?? {}) as Partial<Record<string, string>>;

    try {
      await authService.changePassword(username, password ?? '');

      response.status(204).end();
    } catch (error: unknown) {
      respondWithHttpError(response, error, 'al restablecer una contraseña');
    }
  });

  return router;
}

export { createUsersRouter };

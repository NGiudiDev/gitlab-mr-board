// 2. Dependencias externas.
import express from 'express';

// 6. Imports relativos restantes.
import { HttpError, respondWithHttpError } from '../../../shared/httpError.js';
import { normalizeUsername } from '../services/authService.js';
import { createRequireAdmin } from './auth.js';

const VALID_STATUSES = ['active', 'disabled'];

/**
 * Crea el router de administración de usuarios.
 *
 * Todas sus rutas exigen rol de administrador y **operan sólo sobre la cuenta
 * de quien administra**: el nombre de usuario es único en toda la base, así que
 * sin ese límite un administrador alcanzaría a los usuarios de otra cuenta. El
 * alta pública vive en `/api/auth/register` y no permite elegir rol.
 *
 * No expone el restablecimiento de contraseñas ajenas: fijarle la contraseña a
 * otra persona equivale a poder entrar como ella, así que esa operación quedó
 * sólo en la línea de comandos, que exige acceso al servidor.
 *
 * @param authService Servicio de autenticación ya construido.
 * @returns Router para montar bajo `/api/users`.
 */
function createUsersRouter(authService) {
  const router = express.Router();

  router.use(createRequireAdmin(authService));

  router.get('/', async (_request, response) => {
    const { accountId } = response.locals.user;

    try {
      response.json({ users: await authService.listUsers(accountId) });
    } catch (error) {
      respondWithHttpError(response, error, 'al listar los usuarios');
    }
  });

  router.post('/', async (request, response) => {
    const { accountId } = response.locals.user;
    const { username, password, displayName, role } = request.body ?? {};

    try {
      const user = await authService.createUser({
        accountId,
        username: username ?? '',
        password: password ?? '',
        ...(displayName === undefined ? {} : { displayName }),
        role: role === 'admin' ? 'admin' : ('user'),
      });

      response.status(201).json({ user });
    } catch (error) {
      respondWithHttpError(response, error, 'al crear un usuario');
    }
  });

  router.patch('/:username/status', async (request, response) => {
    const { username = '' } = request.params;
    const { status } = request.body ?? {};
    const currentUser = response.locals.user;

    try {
      if (!VALID_STATUSES.includes(status)) {
        throw new HttpError('El estado debe ser «active» o «disabled».', 400);
      }

      // Deshabilitarse a sí mismo dejaría la cuenta sin administrador si es el
      // único, y en cualquier caso cerraría la sesión en curso.
      if (normalizeUsername(username) === currentUser.username) {
        throw new HttpError('No podés cambiar el estado de tu propio usuario.', 409);
      }

      await authService.requireAccountMember(currentUser.accountId, username);

      response.json({ user: await authService.setUserStatus(username, status) });
    } catch (error) {
      respondWithHttpError(response, error, 'al cambiar el estado de un usuario');
    }
  });

  return router;
}

export { createUsersRouter };

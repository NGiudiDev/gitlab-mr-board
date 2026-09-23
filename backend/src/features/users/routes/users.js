import express from "express";

import { createRequireAdmin, createRequireSession } from "../../auth/routes/auth.js";
import { HttpError, respondWithHttpError } from "../../../shared/httpError.js";
import { normalizeEmail } from "../services/userService.js";

const VALID_STATUSES = ["active", "disabled"];

/**
 * Crea las rutas del perfil propio y de administración de usuarios.
 *
 * @param authService Servicio que valida las sesiones.
 * @param userService Servicio de usuarios ya construido.
 * @returns Router para montar bajo `/api/users`.
 */
function createUsersRouter(authService, userService) {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(authService);

  router.patch("/me/profile", createRequireSession(authService), async (request, response) => {
    const { id } = response.locals.user;
    const { email, displayName } = request.body ?? {};

    try {
      response.json({
        user: await userService.changeOwnProfile(id, {
          ...(email === undefined ? {} : { email }),
          ...(displayName === undefined ? {} : { displayName }),
        }),
      });
    } catch (error) {
      respondWithHttpError(response, error, "al guardar el perfil");
    }
  });

  router.put("/me/gitlab-username", createRequireSession(authService), async (request, response) => {
    const { id } = response.locals.user;
    const { gitlabUsername } = request.body ?? {};

    try {
      response.json({ user: await userService.changeGitlabUsername(id, gitlabUsername) });
    } catch (error) {
      respondWithHttpError(response, error, "al guardar el nickname de GitLab");
    }
  });

  router.get("/", ...requireAdmin, async (_request, response) => {
    const { accountId } = response.locals.user;

    try {
      response.json({ users: await userService.listUsers(accountId) });
    } catch (error) {
      respondWithHttpError(response, error, "al listar los usuarios");
    }
  });

  router.post("/", ...requireAdmin, async (request, response) => {
    const { accountId } = response.locals.user;
    const { email, password, displayName, role } = request.body ?? {};

    try {
      const user = await userService.createUser({
        accountId,
        email: email ?? "",
        password: password ?? "",
        ...(displayName === undefined ? {} : { displayName }),
        role: role === "admin" ? "admin" : "user",
      });

      response.status(201).json({ user });
    } catch (error) {
      respondWithHttpError(response, error, "al crear un usuario");
    }
  });

  router.patch("/:email/status", ...requireAdmin, async (request, response) => {
    const { email = "" } = request.params;
    const { status } = request.body ?? {};
    const currentUser = response.locals.user;

    try {
      if (!VALID_STATUSES.includes(status)) {
        throw new HttpError("El estado debe ser «active» o «disabled».", 400);
      }

      if (normalizeEmail(email) === currentUser.email) {
        throw new HttpError("No podés cambiar el estado de tu propio usuario.", 409);
      }

      await userService.requireAccountMember(currentUser.accountId, email);
      response.json({ user: await userService.setUserStatus(email, status) });
    } catch (error) {
      respondWithHttpError(response, error, "al cambiar el estado de un usuario");
    }
  });

  return router;
}

export { createUsersRouter };

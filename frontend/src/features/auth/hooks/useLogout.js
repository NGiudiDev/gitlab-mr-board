import { useNavigate } from "react-router";

import { APP_PATHS } from "../../../app/constants/routes.consts.js";

import { resetAccountStore } from "../../accounts/hooks/useAccount.js";
import { resetStore } from "../../mergeRequests/hooks/useMergeRequests.js";

import { useSession } from "./useSession.js";

/**
 * Cierra la sesión y deja la aplicación como recién abierta.
 *
 * Reinicia los tres stores compartidos para que la próxima persona que ingrese
 * no vea datos de la anterior, y recién después vuelve al ingreso.
 *
 * @returns {() => Promise<void>} Acción de cierre de sesión.
 */
export function useLogout() {
  const navigate = useNavigate();
  const session = useSession();

  return async function logout() {
    await session.logout();

    resetStore();
    resetAccountStore();

    navigate(APP_PATHS.login, { replace: true });
  };
}

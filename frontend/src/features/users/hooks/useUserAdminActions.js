import { useState } from "react";

import { useUsers } from "./useUsers.js";

import { USER_STATUS } from "../constants/user.consts.js";

/**
 * Suma a la lista de usuarios el resultado visible de cada acción.
 *
 * Mantiene qué fila está ocupada y el último mensaje de éxito o de error, para
 * que la pantalla de administración sólo se ocupe de presentarlos.
 *
 * @returns {object} Lista de usuarios, estado de cada acción y sus disparadores.
 */
export function useUserAdminActions() {
  const { users, loading, error, createUser, setStatus } = useUsers();

  const [actionError, setActionError] = useState(null);
  const [busyEmail, setBusyEmail] = useState(null);
  const [message, setMessage] = useState(null);

  /**
   * Ejecuta una acción sobre un usuario y presenta su resultado.
   *
   * @param {string} email Usuario afectado, que queda bloqueado mientras corre.
   * @param {() => Promise<string | null>} action Acción que devuelve el error, o `null`.
   * @param {string} successMessage Aviso a mostrar cuando la acción se aplica.
   * @returns {Promise<boolean>} `true` cuando la acción se aplicó.
   */
  async function runAction(email, action, successMessage) {
    setBusyEmail(email);
    setActionError(null);
    setMessage(null);

    const failure = await action();

    setBusyEmail(null);

    if (failure) {
      setActionError(failure);
      return false;
    }

    setMessage(successMessage);
    return true;
  }

  function create(user) {
    return runAction(
      user.email,
      () => createUser(user),
      `Usuario «${user.email}» creado.`,
    );
  }

  function toggleStatus(user) {
    const nextStatus = user.status === USER_STATUS.active
      ? USER_STATUS.disabled
      : USER_STATUS.active;

    return runAction(
      user.email,
      () => setStatus(user.email, nextStatus),
      nextStatus === USER_STATUS.disabled
        ? `Usuario «${user.email}» deshabilitado.`
        : `Usuario «${user.email}» habilitado.`,
    );
  }

  return {
    busyEmail,
    createUser: create,
    error: actionError ?? error,
    loading,
    message,
    toggleStatus,
    users,
  };
}

import { USER_STATUS } from "../constants/user.consts.js";

/**
 * Presenta la fecha del último ingreso de una persona.
 *
 * @param {string|null|undefined} isoDate Fecha en formato ISO, o nada.
 * @returns {string} Fecha legible, o el aviso de que nunca ingresó.
 */
export function formatLastLogin(isoDate) {
  if (!isoDate) return "Nunca";

  return new Date(isoDate).toLocaleDateString("es-AR");
}

/**
 * Nombra el estado de una persona dentro de la cuenta.
 *
 * @param {string} status Estado informado por el backend.
 * @returns {string} Texto para la tabla de usuarios.
 */
export function formatUserStatus(status) {
  return status === USER_STATUS.active ? "Habilitado" : "Deshabilitado";
}

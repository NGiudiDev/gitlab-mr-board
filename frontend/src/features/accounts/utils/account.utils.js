//TODO: Eliminar de aca. Esto es parte de la lógica de usuarios.
/**
 * Indica si una persona puede administrar su cuenta.
 *
 * @param {{ role?: string } | null | undefined} user Persona a evaluar.
 * @returns {boolean} `true` cuando tiene el rol de administrador.
 */
export function isAdmin(user) {
  return user?.role === "admin";
}

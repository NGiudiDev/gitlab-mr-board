/**
 * Indica si una persona puede administrar su cuenta.
 *
 * @param {{ role?: string } | null | undefined} user Persona a evaluar.
 * @returns {boolean} `true` cuando tiene el rol de administrador.
 */
export function isAdmin(user) {
  return user?.role === "admin";
}

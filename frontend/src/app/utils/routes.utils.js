import { NAVIGATION_SECTIONS } from "../constants/routes.consts.js";

/**
 * Devuelve las secciones que puede abrir una persona.
 *
 * @param {{ role?: string } | null} user Usuario de la sesión, o `null`.
 * @returns {Array<{ id: string, label: string, path: string, adminOnly?: boolean, menuOnly?: boolean }>} Secciones permitidas.
 */
export function getNavigationSectionsForUser(user) {
  if (user?.role === "admin") return NAVIGATION_SECTIONS;

  return NAVIGATION_SECTIONS.filter((section) => !section.adminOnly);
}
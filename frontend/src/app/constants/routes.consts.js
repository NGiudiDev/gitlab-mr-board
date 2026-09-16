const APP_PATHS = Object.freeze({
  account: "/account",
  board: "/board",
  login: "/login",
  profile: "/profile",
  register: "/register",
  users: "/users",
});

const NAVIGATION_SECTIONS = Object.freeze([
  { id: "board", label: "Tablero", path: APP_PATHS.board },
  { id: "profile", label: "Mi perfil", menuOnly: true, path: APP_PATHS.profile },
  { id: "account", label: "Mi cuenta", menuOnly: true, path: APP_PATHS.account },
  { id: "users", label: "Usuarios", adminOnly: true, path: APP_PATHS.users },
]);

/**
 * Devuelve las secciones que puede abrir una persona.
 *
 * @param {{ role?: string } | null} user Usuario de la sesión, o `null`.
 * @returns {Array<{ id: string, label: string, path: string, adminOnly?: boolean, menuOnly?: boolean }>} Secciones permitidas.
 */
function sectionsFor(user) {
  if (user?.role === "admin") return NAVIGATION_SECTIONS;

  return NAVIGATION_SECTIONS.filter((section) => !section.adminOnly);
}

export { APP_PATHS, NAVIGATION_SECTIONS, sectionsFor };

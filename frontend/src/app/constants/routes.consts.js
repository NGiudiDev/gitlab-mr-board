export const APP_PATHS = Object.freeze({
  account: "/account",
  board: "/board",
  login: "/login",
  profile: "/profile",
  register: "/register",
  users: "/users",
});

export const NAVIGATION_SECTIONS = Object.freeze([
  { id: "board", label: "Tablero", menuOnly: false, path: APP_PATHS.board },
  { id: "profile", label: "Mi perfil", menuOnly: true, path: APP_PATHS.profile },
  { id: "account", label: "Mi cuenta", menuOnly: true, path: APP_PATHS.account },
  { id: "users", label: "Usuarios", adminOnly: true, path: APP_PATHS.users },
]);

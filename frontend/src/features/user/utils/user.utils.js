/**
 * Obtiene hasta dos iniciales para representar a la persona sin una imagen.
 *
 * @param {{ displayName?: string, email?: string } | null} user Usuario de la sesión.
 * @returns {string} Iniciales en mayúsculas.
 */
export function getUserInitials(user) {
  const label = user?.displayName?.trim() || user?.email?.trim() || "?";
  
  const words = label.split(/\s+/);
  
  const initials = words.length > 1
    ? `${words[0][0]}${words.at(-1)[0]}`
    : label.slice(0, 2);

   return initials.toLocaleUpperCase("es");
}

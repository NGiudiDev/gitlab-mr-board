/**
 * Convierte un texto libre en un identificador válido para el DOM.
 *
 * Lo usan los `id` que relacionan un encabezado con su región: deben ser
 * estables y no pueden llevar barras, espacios ni acentos.
 *
 * @param {string} value Nombre de proyecto o de columna.
 * @returns {string} Texto en minúsculas, con guiones y sin signos.
 */
export function toDomId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

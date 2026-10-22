/**
 * Elige el color del punto que resume el estado del tablero.
 *
 * El color nunca va solo: el texto que lo acompaña dice lo mismo.
 *
 * @param {{ error?: string|null, lastFetched?: Date|null, loading?: boolean }} state Estado de la última consulta.
 * @returns {string} Token de color del punto.
 */
export function statusDotColor({ error, lastFetched, loading }) {
  if (loading) return "var(--color-draft)";
  if (error) return "var(--color-conflict)";
  if (lastFetched) return "var(--color-ready)";

  return "var(--color-text-faint)";
}

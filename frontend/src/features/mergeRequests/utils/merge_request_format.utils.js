/**
 * Formatea una fecha del merge request con fecha y hora locales.
 *
 * @param {string} iso Fecha en formato ISO.
 * @returns {string} Fecha legible para la interfaz.
 */
export function formatMergeRequestDateTime(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/**
 * Resume cuánto tiempo pasó desde la última actualización.
 *
 * @param {string} iso Fecha en formato ISO.
 * @param {number} currentTime Instante de referencia en milisegundos.
 * @returns {string} Cantidad de minutos, horas o días transcurridos.
 */
export function formatRelativeTime(iso, currentTime = Date.now()) {
  const elapsedSeconds = (currentTime - new Date(iso).getTime()) / 1000;
  
  if (elapsedSeconds < 3600) {
    return `${Math.max(1, Math.round(elapsedSeconds / 60))}m`;
  }
  
  if (elapsedSeconds < 86400) return `${Math.round(elapsedSeconds / 3600)}h`;
  
  return `${Math.round(elapsedSeconds / 86400)}d`;
}

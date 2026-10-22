import { VIEW_MODES } from "../constants/merge_request_view.consts.js";

/**
 * Construye el anuncio accesible correspondiente al estado actual del tablero.
 *
 * @param {object} state Estado visible y filtros activos del tablero.
 * @returns {string} Mensaje que debe anunciar la región viva.
 */
export function buildBoardAnnouncement(state) {
  const {
    canChoosePerson,
    error,
    lastFetched,
    loading,
    needsGitlabSettings,
    selectedPerson,
    total,
    viewMode,
  } = state;

  if (loading) return "Actualizando merge requests.";
  if (error) return `No se pudieron actualizar los datos: ${error}`;
  if (needsGitlabSettings) return "Falta configurar GitLab en la cuenta.";
  if (!lastFetched) return "";

  if (viewMode === VIEW_MODES.personal && !selectedPerson) {
    return canChoosePerson
      ? "Vista personal. Elegí una persona."
      : "Vista personal. Falta tu nickname de GitLab en «Mi cuenta».";
  }

  if (viewMode === VIEW_MODES.personal) {
    return `Vista personal de ${selectedPerson.name}. Se muestran ${total} merge requests.`;
  }

  return `Actualización completa. Se muestran ${total} merge requests.`;
}

/**
 * Encabeza el tablero según la vista activa.
 *
 * @param {string} viewMode Vista general o personal.
 * @param {{name: string}|null} selectedPerson Persona de la vista personal.
 * @returns {string} Título de la sección del tablero.
 */
export function buildBoardHeading(viewMode, selectedPerson) {
  if (viewMode === VIEW_MODES.personal && selectedPerson) {
    return `Tareas de ${selectedPerson.name} por estado`;
  }

  return "Merge requests por proyecto y estado";
}

/**
 * Explica por qué el tablero no tiene tarjetas para mostrar.
 *
 * @param {object} state Carga, vista activa y cantidades ya filtradas.
 * @returns {string|null} Mensaje a presentar, o `null` si hay tarjetas.
 */
export function buildBoardEmptyMessage(state) {
  const {
    canChoosePerson,
    loading,
    personalTotal,
    personalUsername,
    total,
    viewMode,
  } = state;

  if (total === 0) {
    return loading ? "Cargando merge requests..." : "No hay merge requests abiertos.";
  }

  if (viewMode !== VIEW_MODES.personal) return null;

  if (!personalUsername) {
    return canChoosePerson
      ? "Elegí una persona para ver sus tareas pendientes."
      : "Configurá tu nickname de GitLab en «Mi cuenta» para ver tus tareas.";
  }

  if (personalTotal === 0) {
    return canChoosePerson
      ? "No hay tareas pendientes para esta persona."
      : "No tenés tareas pendientes.";
  }

  return null;
}

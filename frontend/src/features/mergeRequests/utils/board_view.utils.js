import { findPersonByUsername, mergeRequestsForPerson } from "./personal_view.utils.js";

import { VIEW_MODES } from "../constants/merge_request_view.consts.js";

/**
 * Resuelve de quién es la vista personal.
 *
 * Quien administra elige a cualquier integrante; el resto siempre ve la suya,
 * según el nickname de GitLab que el backend devolvió en `meta`.
 *
 * @param {boolean} canChoosePerson `true` cuando puede elegir a otra persona.
 * @param {object|null} meta Metadatos del tablero.
 * @param {string|null} selectedUsername Persona elegida en los controles.
 * @returns {string|null} Identidad de GitLab de la vista personal.
 */
function resolvePersonalUsername(canChoosePerson, meta, selectedUsername) {
  if (canChoosePerson) return selectedUsername;

  return meta?.viewerUsername ?? null;
}

/**
 * Calcula qué muestra el tablero con la vista y la persona elegidas.
 *
 * Sólo selecciona y cuenta lo que ya llegó resuelto del backend: la
 * clasificación y los responsables no se recalculan acá.
 *
 * @param {object} state Vista activa, datos del tablero y permisos de quien mira.
 * @returns {object} Personas, merge requests visibles y metadatos ajustados.
 */
export function buildBoardView(state) {
  const { canChoosePerson, mergeRequests, meta, selectedUsername, viewMode } = state;

  const people = meta?.people ?? [];
  const personalUsername = resolvePersonalUsername(canChoosePerson, meta, selectedUsername);
  const personalMergeRequests = mergeRequestsForPerson(mergeRequests, personalUsername);
  const isPersonal = viewMode === VIEW_MODES.personal;
  const visibleMergeRequests = isPersonal ? personalMergeRequests : mergeRequests;

  // Con la vista personal filtrando, el resumen cuenta sólo los proyectos que
  // siguen a la vista.
  const visibleProjects = new Set(visibleMergeRequests.map((mr) => mr.projectPath)).size;

  return {
    people,
    personalMergeRequests,
    personalUsername,
    selectedPerson: findPersonByUsername(people, personalUsername)
      ?? (personalUsername ? { name: `@${personalUsername}`, username: personalUsername } : null),
    visibleMergeRequests,
    visibleMeta: meta ? {
      ...meta,
      projectCount: isPersonal ? visibleProjects : meta.projectCount,
      totalMRs: visibleMergeRequests.length,
    } : null,
  };
}

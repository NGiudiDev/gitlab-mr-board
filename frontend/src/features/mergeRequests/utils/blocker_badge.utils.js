import {
  APPROVAL_TONES,
  BLOCKER_TONES,
  PIPELINE_ICONS,
  PIPELINE_LABELS,
  PIPELINE_TONES,
  UNKNOWN_PIPELINE_ICON,
  UNKNOWN_PIPELINE_LABEL,
} from "../constants/blocker_badge.consts.js";

/**
 * @typedef {object} BlockerDescription
 * @property {[string, string]} colors Fondo y color de texto del badge.
 * @property {string} icon Signo que acompaña al texto, decorativo.
 * @property {string} label Texto corto visible en el badge.
 * @property {string|null} linkUrl Destino del badge cuando lleva a GitLab.
 * @property {string} tooltip Explicación completa, usada como nombre accesible.
 */

/** Describe el estado del pipeline, único badge que puede enlazar a GitLab. */
function describePipeline(data) {
  return {
    colors: PIPELINE_TONES[data.status] ?? BLOCKER_TONES.neutral,
    icon: PIPELINE_ICONS[data.status] ?? UNKNOWN_PIPELINE_ICON,
    label: PIPELINE_LABELS[data.status] || UNKNOWN_PIPELINE_LABEL,
    linkUrl: data.pipelineUrl || null,
    tooltip: `Pipeline: ${data.status}`,
  };
}

/** Describe los hilos de discusión sin resolver. */
function describeThreads(data) {
  const count = data.unresolvedCount;
  const pending = count > 0;

  return {
    colors: pending ? BLOCKER_TONES.conflict : BLOCKER_TONES.ready,
    icon: pending ? "✉" : "✓",
    label: pending ? `${count} hilo${count > 1 ? "s" : ""}` : "Hilos OK",
    linkUrl: null,
    tooltip: `${count} hilos sin resolver`,
  };
}

/** Arma la explicación de las aprobaciones, que suma quiénes aprobaron. */
function approvalsTooltip(data) {
  if (data.status === "unknown") return "No se pudo obtener info de approvals";

  const { approvers, given, hasLeadApproval, required } = data;
  const parts = [`${given}/${required} aprobaciones`];

  if (approvers && approvers.length > 0) parts.push(`Aprobado por: ${approvers.join(", ")}`);
  if (!hasLeadApproval) parts.push("Falta aprobación del líder");

  return parts.join("\n");
}

/** Describe cuántas aprobaciones reunió el merge request. */
function describeApprovals(data) {
  return {
    colors: APPROVAL_TONES[data.status] ?? BLOCKER_TONES.neutral,
    icon: data.status === "approved" ? "✓" : "✎",
    label: data.status === "unknown" ? "Approvals ?" : `${data.given}/${data.required}`,
    linkUrl: null,
    tooltip: approvalsTooltip(data),
  };
}

/** Describe si la rama tiene conflictos con su destino. */
function describeConflicts(data) {
  return {
    colors: data.hasConflicts ? BLOCKER_TONES.conflict : BLOCKER_TONES.ready,
    icon: data.hasConflicts ? "✗" : "✓",
    label: data.hasConflicts ? "Con conflictos" : "Sin conflictos",
    linkUrl: null,
    tooltip: data.hasConflicts ? "Tiene conflictos de merge" : "Sin conflictos de merge",
  };
}

const DESCRIBERS = {
  approvals: describeApprovals,
  conflicts: describeConflicts,
  pipeline: describePipeline,
  threads: describeThreads,
};

/**
 * Traduce un bloqueante del contrato a lo que necesita presentar su badge.
 *
 * @param {string} type Bloqueante: `pipeline`, `threads`, `approvals` o `conflicts`.
 * @param {object} data Datos de ese bloqueante, ya calculados por el backend.
 * @returns {BlockerDescription} Texto, icono, colores y enlace del badge.
 */
export function describeBlocker(type, data) {
  const describe = DESCRIBERS[type];

  if (!describe) {
    return { colors: BLOCKER_TONES.neutral, icon: "", label: "", linkUrl: null, tooltip: "" };
  }

  return describe(data);
}

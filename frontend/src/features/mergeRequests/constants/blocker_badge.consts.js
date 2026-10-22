/** Pares de color de fondo y de texto, por significado del badge. */
export const BLOCKER_TONES = Object.freeze({
  conflict: ["var(--color-conflict-soft)", "var(--color-conflict)"],
  neutral: ["var(--color-surface)", "var(--color-text-muted)"],
  pending: ["var(--color-draft-soft)", "var(--color-draft)"],
  ready: ["var(--color-ready-soft)", "var(--color-ready)"],
});

export const PIPELINE_ICONS = Object.freeze({
  canceled: "✗",
  failed: "✗",
  pending: "●",
  running: "●",
  success: "✓",
});

export const PIPELINE_LABELS = Object.freeze({
  canceled: "CI Cancel",
  failed: "CI Falló",
  none: "Sin CI",
  pending: "CI...",
  running: "CI...",
  success: "CI OK",
});

export const PIPELINE_TONES = Object.freeze({
  canceled: BLOCKER_TONES.conflict,
  failed: BLOCKER_TONES.conflict,
  pending: BLOCKER_TONES.pending,
  running: BLOCKER_TONES.pending,
  success: BLOCKER_TONES.ready,
});

export const APPROVAL_TONES = Object.freeze({
  approved: BLOCKER_TONES.ready,
  pending: BLOCKER_TONES.pending,
});

export const UNKNOWN_PIPELINE_ICON = "–";

export const UNKNOWN_PIPELINE_LABEL = "CI ?";

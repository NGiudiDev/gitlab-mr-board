/** Color del borde de la tarjeta según la clasificación que calculó el backend. */
export const COLOR_BY_MERGEABILITY = Object.freeze({
  backlog: "var(--color-text-muted)",
  in_progress: "var(--color-text-faint)",
  mr_warning: "var(--color-draft)",
  qa: "#c084fc",
  ready_to_merge: "var(--color-ready)",
  review: "#60a5fa",
});

export const DEFAULT_MERGEABILITY_COLOR = "var(--color-text-faint)";

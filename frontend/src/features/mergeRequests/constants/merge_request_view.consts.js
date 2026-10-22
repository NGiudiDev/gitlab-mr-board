export const VIEW_MODES = Object.freeze({
  general: "general",
  personal: "personal",
});

/** Vistas que ofrece el tablero, en el orden en que se presentan. */
export const VIEW_OPTIONS = Object.freeze([
  { id: VIEW_MODES.general, label: "General" },
  { id: VIEW_MODES.personal, label: "Personal" },
]);

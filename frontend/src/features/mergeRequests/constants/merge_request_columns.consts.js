/** Columnas del tablero, en el orden en que se presentan. */
export const MERGE_REQUEST_COLUMNS = Object.freeze([
  { id: "unknown", name: "Estado desconocido" },
  { id: "in_progress", name: "En progreso" },
  { id: "mr_warning", name: "Pendientes" },
  { id: "review", name: "Code Review" },
  { id: "qa", name: "QA" },
  { id: "ready_to_merge", name: "Listas para mergear" },
  { id: "backlog", name: "Pausados" },
]);

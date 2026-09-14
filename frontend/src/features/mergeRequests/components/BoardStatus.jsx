const BOARD_STATUS_CLASSES = "text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface";

/** Presenta de forma consistente un estado informativo del tablero. */
function BoardStatus({ children, role = "status" }) {
  return <div className={BOARD_STATUS_CLASSES} role={role}>{children}</div>;
}

export { BOARD_STATUS_CLASSES, BoardStatus };

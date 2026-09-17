import { STATUS_PANEL_CLASSES } from "../../../app/constants/styles.consts.js";

/** Presenta de forma consistente un estado informativo del tablero. */
function BoardStatus({ children, role = "status" }) {
  return <div className={STATUS_PANEL_CLASSES} role={role}>{children}</div>;
}

export { BoardStatus };

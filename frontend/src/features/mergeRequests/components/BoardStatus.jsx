import { STATUS_PANEL_CLASSES } from "../../../app/constants/styles.consts.js";

export function BoardStatus(props) {
  const { children, role = "status" } = props;

  return <div className={STATUS_PANEL_CLASSES} role={role}>{children}</div>;
}

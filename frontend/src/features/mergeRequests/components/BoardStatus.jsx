import { StatusPanel } from "../../../app/constants/styles.consts.js";

export function BoardStatus(props) {
  const { children, role = "status" } = props;

  return <StatusPanel role={role}>{children}</StatusPanel>;
}

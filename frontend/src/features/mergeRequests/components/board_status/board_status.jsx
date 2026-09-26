import { Styles } from "../../../../app/app.styles.jsx";

export function BoardStatus(props) {
  const { children, role = "status" } = props;

  return <Styles.StatusPanel role={role}>{children}</Styles.StatusPanel>;
}

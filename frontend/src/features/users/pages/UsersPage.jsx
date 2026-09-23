import { UserAdmin } from "../components/UserAdmin.jsx";

export function UsersPage(props) {
  const { currentEmail } = props;

  return <UserAdmin currentEmail={currentEmail} />;
}

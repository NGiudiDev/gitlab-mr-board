import { UserAdmin } from "../../components/user_admin/user_admin.jsx";

export function UsersPage(props) {
  const { currentEmail } = props;

  return <UserAdmin currentEmail={currentEmail} />;
}

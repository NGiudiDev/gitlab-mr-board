import { UserAdmin } from "../components/UserAdmin.jsx";

export function UsersPage({ currentEmail }) {
  return <UserAdmin currentEmail={currentEmail} />;
}

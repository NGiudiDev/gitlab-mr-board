import { PasswordPanel } from "../components/PasswordPanel.jsx";
import { ProfilePanel } from "../components/ProfilePanel.jsx";

export function ProfilePage(props) {
  const { onChangePassword, onSaveProfile, submitting, user } = props;

  return (
    <div className="mx-auto max-w-xl divide-y divide-border-soft [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      <ProfilePanel onSave={onSaveProfile} submitting={submitting} user={user} />
      <PasswordPanel
        onChangePassword={onChangePassword}
        submitting={submitting}
        user={user}
      />
    </div>
  );
}

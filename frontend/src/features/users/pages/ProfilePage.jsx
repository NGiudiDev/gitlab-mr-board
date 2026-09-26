import { Styles } from "../../../app/app.styles.jsx";

import { PasswordPanel } from "../../auth/components/PasswordPanel.jsx";
import { ProfilePanel } from "../components/ProfilePanel.jsx";

export function ProfilePage(props) {
  const {
    onChangePassword,
    onSaveProfile,
    passwordSubmitting,
    profileSubmitting,
    user,
  } = props;

  return (
    <Styles.PageSections>
      <ProfilePanel onSave={onSaveProfile} submitting={profileSubmitting} user={user} />

      <PasswordPanel
        onChangePassword={onChangePassword}
        submitting={passwordSubmitting}
        user={user}
      />
    </Styles.PageSections>
  );
}

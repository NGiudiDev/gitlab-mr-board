import { PasswordPanel } from "../../../auth/components/password_panel/password_panel.jsx";
import { ProfilePanel } from "../../components/profile_panel/profile_panel.jsx";

import { Styles } from "../../../../app/app.styles.jsx";

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

import { PAGE_SECTIONS_CLASSES } from "../../../app/constants/styles.consts.js";

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
    <div className={PAGE_SECTIONS_CLASSES}>
      <ProfilePanel onSave={onSaveProfile} submitting={profileSubmitting} user={user} />

      <PasswordPanel
        onChangePassword={onChangePassword}
        submitting={passwordSubmitting}
        user={user}
      />
    </div>
  );
}

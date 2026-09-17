import { PAGE_SECTIONS_CLASSES } from "../../../app/constants/styles.consts.js";

import { PasswordPanel } from "../components/PasswordPanel.jsx";
import { ProfilePanel } from "../components/ProfilePanel.jsx";

export function ProfilePage(props) {
  const { onChangePassword, onSaveProfile, submitting, user } = props;

  return (
    <div className={PAGE_SECTIONS_CLASSES}>
      <ProfilePanel onSave={onSaveProfile} submitting={submitting} user={user} />
      <PasswordPanel
        onChangePassword={onChangePassword}
        submitting={submitting}
        user={user}
      />
    </div>
  );
}

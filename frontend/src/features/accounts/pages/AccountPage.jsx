import { useAccount } from "../hooks/useAccount.js";


import { AccountMemberInviteSection } from "../components/AccountMemberInviteSection.jsx";
import { AccountSettingsSection } from "../components/AccountSettingsSection.jsx";
import { GitlabAccountSettingsSection } from "../../gitlabAccount/components/GitlabAccountSettingsSection.jsx";
import { GitlabUserSettingsSection } from "../../users/components/GitlabUserSettingsSection.jsx";

import { fetchMergeRequests } from "../../mergeRequests/hooks/useMergeRequests.js";
import { isAdmin } from "../utils/account.utils.js";

import {
  Alert,
  LoadingText,
  PageSections,
} from "../../../app/constants/styles.consts.js";


export function AccountPage(props) {
  const { onSaveGitlabUsername, submitting, user } = props;

  const {
    account,
    error: accountError,
    loading: accountLoading,
    submitting: accountSubmitting,
    rotateInviteCode,
  } = useAccount(user.accountId);

  const hasAdminRole = isAdmin(user);

  return (
    <PageSections>
      {accountLoading && !account ? (
        <section aria-label="Estado de la cuenta">
          <LoadingText role="status">Cargando la cuenta...</LoadingText>
        </section>
      ) : accountError && !account ? (
        <section aria-label="Estado de la cuenta">
          <Alert role="alert">
            {accountError}
          </Alert>
        </section>
      ) : (
        <AccountSettingsSection account={account} />
      )}

      {hasAdminRole && account?.inviteCode ? (
        <AccountMemberInviteSection
          inviteCode={account.inviteCode}
          onRotate={rotateInviteCode}
          submitting={accountSubmitting}
        />
      ) : null}

      <GitlabAccountSettingsSection
        canEdit={hasAdminRole}
        onSaved={() => fetchMergeRequests(true)}
      />

      <GitlabUserSettingsSection
        onSave={onSaveGitlabUsername}
        submitting={submitting}
        user={user}
      />
    </PageSections>
  );
}

import { GitlabAccountSettingsSection } from "../../gitlabAccount/components/GitlabAccountSettingsSection.jsx";
import { GitlabUserSettingsSection } from "../../gitlabUser/components/GitlabUserSettingsSection.jsx";
import { fetchMergeRequests } from "../../mergeRequests/hooks/useMergeRequests.js";
import { AccountMemberInviteSection } from "../components/AccountMemberInviteSection.jsx";
import { AccountSettingsSection } from "../components/AccountSettingsSection.jsx";
import { useAccount } from "../hooks/useAccount.js";

/** Presenta la configuración compartida de la cuenta y la personal de GitLab. */
function AccountPage({ onSaveGitlabUsername, submitting, user }) {
  const {
    account,
    error: accountError,
    loading: accountLoading,
    submitting: accountSubmitting,
    rotateInviteCode,
  } = useAccount(user.accountId);
  const isAdmin = user.role === "admin";

  return (
    <div className="mx-auto max-w-xl divide-y divide-border-soft [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      {accountLoading && !account ? (
        <section aria-label="Estado de la cuenta">
          <p className="text-[13px] text-text-muted" role="status">Cargando la cuenta...</p>
        </section>
      ) : accountError && !account ? (
        <section aria-label="Estado de la cuenta">
          <p className="rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary" role="alert">
            {accountError}
          </p>
        </section>
      ) : (
        <AccountSettingsSection account={account} />
      )}

      {isAdmin && account?.inviteCode ? (
        <AccountMemberInviteSection
          inviteCode={account.inviteCode}
          onRotate={rotateInviteCode}
          submitting={accountSubmitting}
        />
      ) : null}

      <GitlabAccountSettingsSection
        canEdit={isAdmin}
        onSaved={() => fetchMergeRequests(true)}
      />

      <GitlabUserSettingsSection
        onSave={onSaveGitlabUsername}
        submitting={submitting}
        user={user}
      />
    </div>
  );
}

export { AccountPage };

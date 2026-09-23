import { Navigate, Route, Routes, useNavigate } from "react-router";

import { AppLayout } from "./components/AppLayout.jsx";
import { APP_PATHS } from "./constants/routes.consts.js";
import { STATUS_PANEL_CLASSES } from "./constants/styles.consts.js";

import { resetAccountStore } from "../features/accounts/hooks/useAccount.js";
import { AccountPage } from "../features/accounts/pages/AccountPage.jsx";
import { isAdmin } from "../features/accounts/utils/account.utils.js";
import { useSession } from "../features/auth/hooks/useSession.js";
import { LoginPage } from "../features/auth/pages/LoginPage.jsx";
import { RegisterPage } from "../features/auth/pages/RegisterPage.jsx";
import { resetStore } from "../features/mergeRequests/hooks/useMergeRequests.js";
import { BoardPage } from "../features/mergeRequests/pages/BoardPage.jsx";
import { useCurrentUser } from "../features/users/hooks/useCurrentUser.js";
import { ProfilePage } from "../features/users/pages/ProfilePage.jsx";
import { UsersPage } from "../features/users/pages/UsersPage.jsx";

export function App() {
  const navigate = useNavigate();
  const session = useSession();
  const currentUser = useCurrentUser();

  async function handleLogout() {
    await session.logout();
    resetStore();
    resetAccountStore();
    navigate(APP_PATHS.login, { replace: true });
  }

  if (session.status === "checking") {
    return (
      <AppLayout>
        <div className={STATUS_PANEL_CLASSES} role="status">
          Verificando tu sesión...
        </div>
      </AppLayout>
    );
  }

  if (session.status === "authenticated") {
    const hasAdminRole = isAdmin(session.user);

    return (
      <AppLayout onLogout={handleLogout} user={session.user}>
        <Routes>
          <Route
            element={(
              <BoardPage
                canChoosePerson={hasAdminRole}
                canConfigureGitlab={hasAdminRole}
              />
            )}
            path={APP_PATHS.board}
          />

          <Route
            element={(
              <AccountPage
                onSaveGitlabUsername={currentUser.saveGitlabUsername}
                submitting={currentUser.submitting}
                user={session.user}
              />
            )}
            path={APP_PATHS.account}
          />

          <Route
            element={(
              <ProfilePage
                onChangePassword={session.changeOwnPassword}
                onSaveProfile={currentUser.saveProfile}
                passwordSubmitting={session.submitting}
                profileSubmitting={currentUser.submitting}
                user={session.user}
              />
            )}
            path={APP_PATHS.profile}
          />

          <Route
            element={hasAdminRole
              ? <UsersPage currentEmail={session.user.email} />
              : <Navigate replace to={APP_PATHS.board} />}
            path={APP_PATHS.users}
          />

          <Route element={<Navigate replace to={APP_PATHS.board} />} path="*" />
        </Routes>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route
          element={(
            <LoginPage
              error={session.error}
              notice={session.notice}
              onLogin={session.login}
              submitting={session.submitting}
            />
          )}
          path={APP_PATHS.login}
        />

        <Route
          element={(
            <RegisterPage
              error={session.error}
              onRegister={session.register}
              submitting={session.submitting}
            />
          )}
          path={APP_PATHS.register}
        />

        <Route element={<Navigate replace to={APP_PATHS.login} />} path="*" />
      </Routes>
    </AppLayout>
  );
}

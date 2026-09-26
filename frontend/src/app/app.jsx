import { Navigate, Route, Routes, useNavigate } from "react-router";

import { useCurrentUser } from "../features/users/hooks/useCurrentUser.js";
import { useSession } from "../features/auth/hooks/useSession.js";

import { AccountPage } from "../features/accounts/pages/AccountPage.jsx";
import { AppLayout } from "./components/app_layout/app_layout.jsx";
import { BoardPage } from "../features/mergeRequests/pages/BoardPage.jsx";
import { LoginPage } from "../features/auth/pages/LoginPage.jsx";
import { ProfilePage } from "../features/users/pages/ProfilePage.jsx";
import { RegisterPage } from "../features/auth/pages/RegisterPage.jsx";
import { UsersPage } from "../features/users/pages/UsersPage.jsx";

import { Styles } from "./app.styles.jsx";

import { isAdmin } from "../features/accounts/utils/account.utils.js";
import { resetAccountStore } from "../features/accounts/hooks/useAccount.js";
import { resetStore } from "../features/mergeRequests/hooks/useMergeRequests.js";

import { APP_PATHS } from "./constants/routes.consts.js";

export function App() {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const session = useSession();

  async function handleLogout() {
    await session.logout();
    
    resetStore();
    resetAccountStore();
    
    navigate(APP_PATHS.login, { replace: true });
  }

  if (session.status === "checking") {
    return (
      <AppLayout>
        <Styles.StatusPanel role="status">
          Verificando tu sesión...
        </Styles.StatusPanel>
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

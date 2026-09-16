import { Navigate, Route, Routes, useNavigate } from "react-router";

import { useSession } from "../features/auth/hooks/useSession.js";

import { AccountPage } from "../features/accounts/pages/AccountPage.jsx";
import { AppLayout } from "./components/AppLayout.jsx";
import { BoardPage } from "../features/mergeRequests/pages/BoardPage.jsx";
import { LoginPage } from "../features/auth/pages/LoginPage.jsx";
import { ProfilePage } from "../features/auth/pages/ProfilePage.jsx";
import { RegisterPage } from "../features/auth/pages/RegisterPage.jsx";
import { UsersPage } from "../features/auth/pages/UsersPage.jsx";

import { resetStore } from "../features/mergeRequests/hooks/useMergeRequests.js";
import { resetAccountStore } from "../features/accounts/hooks/useAccount.js";

import { APP_PATHS } from "./constants/routes.consts.js";

const SESSION_STATUS_CLASSES = "text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface";

export function App() {
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
        <div className={SESSION_STATUS_CLASSES} role="status">
          Verificando tu sesión...
        </div>
      </AppLayout>
    );
  }

  if (session.status === "authenticated") {
    const isAdmin = session.user.role === "admin";

    return (
      <AppLayout onLogout={handleLogout} user={session.user}>
        <Routes>
          <Route
            element={(
              <BoardPage
                canChoosePerson={isAdmin}
                canConfigureGitlab={isAdmin}
              />
            )}
            path={APP_PATHS.board}
          />

          <Route
            element={(
              <AccountPage
                onSaveGitlabUsername={session.saveGitlabUsername}
                submitting={session.submitting}
                user={session.user}
              />
            )}
            path={APP_PATHS.account}
          />

          <Route
            element={(
              <ProfilePage
                onChangePassword={session.changeOwnPassword}
                onSaveProfile={session.saveProfile}
                submitting={session.submitting}
                user={session.user}
              />
            )}
            path={APP_PATHS.profile}
          />

          <Route
            element={isAdmin
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

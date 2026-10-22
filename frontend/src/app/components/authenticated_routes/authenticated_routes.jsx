import { Navigate, Route, Routes } from "react-router";

import { useCurrentUser } from "../../../features/users/hooks/useCurrentUser.js";

import { AccountPage } from "../../../features/accounts/pages/account_page/account_page.jsx";
import { BoardPage } from "../../../features/mergeRequests/pages/board_page/board_page.jsx";
import { ProfilePage } from "../../../features/users/pages/profile_page/profile_page.jsx";
import { UsersPage } from "../../../features/users/pages/users_page/users_page.jsx";

import { isAdmin } from "../../../features/users/utils/user.utils.js";

import { APP_PATHS } from "../../constants/routes.consts.js";

export function AuthenticatedRoutes(props) {
  const { session } = props;

  const currentUser = useCurrentUser();

  const hasAdminRole = isAdmin(session.user);

  return (
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
  );
}

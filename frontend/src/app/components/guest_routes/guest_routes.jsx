import { Navigate, Route, Routes } from "react-router";

import { ForgotPasswordPage } from "../../../features/auth/pages/forgot_password_page/forgot_password_page.jsx";
import { LoginPage } from "../../../features/auth/pages/login_page/login_page.jsx";
import { RegisterPage } from "../../../features/auth/pages/register_page/register_page.jsx";
import { ResetPasswordPage } from "../../../features/auth/pages/reset_password_page/reset_password_page.jsx";

import { APP_PATHS } from "../../constants/routes.consts.js";

export function GuestRoutes(props) {
  const { session } = props;

  return (
    <Routes>
      <Route
        element={(
          <ForgotPasswordPage
            error={session.error}
            notice={session.notice}
            onRequestPasswordReset={session.requestPasswordReset}
            submitting={session.submitting}
          />
        )}
        path={APP_PATHS.forgotPassword}
      />

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

      <Route
        element={(
          <ResetPasswordPage
            error={session.error}
            onResetPassword={session.resetPassword}
            submitting={session.submitting}
          />
        )}
        path={APP_PATHS.resetPassword}
      />

      <Route element={<Navigate replace to={APP_PATHS.login} />} path="*" />
    </Routes>
  );
}

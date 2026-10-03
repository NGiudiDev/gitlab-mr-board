import { useNavigate } from "react-router";

import { APP_PATHS } from "../../../../app/constants/routes.consts.js";
import { ForgotPasswordForm } from "../../components/forgot_password_form/forgot_password_form.jsx";

export function ForgotPasswordPage(props) {
  const { error, notice, onRequestPasswordReset, submitting } = props;
  const navigate = useNavigate();

  return (
    <ForgotPasswordForm
      error={error}
      notice={notice}
      onShowLogin={() => navigate(APP_PATHS.login)}
      onSubmit={onRequestPasswordReset}
      submitting={submitting}
    />
  );
}

import { useNavigate, useSearchParams } from "react-router";

import { APP_PATHS } from "../../../../app/constants/routes.consts.js";
import { ResetPasswordForm } from "../../components/reset_password_form/reset_password_form.jsx";

export function ResetPasswordPage(props) {
  const { error, onResetPassword, submitting } = props;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  async function handleSubmit({ newPassword }) {
    const changed = await onResetPassword({ token, newPassword });
    if (changed) navigate(APP_PATHS.login, { replace: true });
  }

  return (
    <ResetPasswordForm
      error={error}
      hasToken={Boolean(token)}
      onShowLogin={() => navigate(APP_PATHS.login)}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}

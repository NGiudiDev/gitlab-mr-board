import { useNavigate } from "react-router";

import { APP_PATHS } from "../../../app/constants/routes.consts.js";

import { LoginForm } from "../components/LoginForm.jsx";

export function LoginPage(props) {
  const { error, notice, onLogin, submitting } = props;

  const navigate = useNavigate();

  return (
    <LoginForm
      error={error}
      notice={notice}
      onShowRegister={() => navigate(APP_PATHS.register)}
      onSubmit={onLogin}
      submitting={submitting}
    />
  );
}

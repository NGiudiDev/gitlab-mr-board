import { useNavigate } from "react-router";

import { RegisterForm } from "../components/RegisterForm.jsx";

import { APP_PATHS } from "../../../app/constants/routes.consts.js";

export function RegisterPage(props) {
  const { error, onRegister, submitting } = props;

  const navigate = useNavigate();

  return (
    <RegisterForm
      error={error}
      onShowLogin={() => navigate(APP_PATHS.login)}
      onSubmit={onRegister}
      submitting={submitting}
    />
  );
}

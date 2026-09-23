import { useState } from "react";

import {
  Alert,
  AuthForm,
  AuthFormDescription,
  AuthFormHeading,
  AuthFormSwitch,
  AuthSubmitButton,
  ButtonLink,
  Field,
  SpacedLabel,
} from "../../../app/constants/styles.consts.js";

export function LoginForm(props) {
  const {
    error = null,
    notice = null,
    onShowRegister = () => {},
    onSubmit = () => {},
    submitting = false,
  } = props;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email: email.trim(), password });
  }

  return (
    <AuthForm aria-labelledby="login-heading" onSubmit={handleSubmit}>
      <AuthFormHeading id="login-heading">
        Tablero de MRs
      </AuthFormHeading>

      <AuthFormDescription>Ingresá con tu email para ver el tablero.</AuthFormDescription>

      {error ? (
        <Alert role="alert">
          {error}
        </Alert>
      ) : null}

      {notice ? (
        <Alert $success role="status">
          {notice}
        </Alert>
      ) : null}

      <SpacedLabel htmlFor="login-email">
        Email
        <Field
          autoCapitalize="none"
          autoComplete="email"
          id="login-email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          spellCheck="false"
          type="text"
          value={email}
        />
      </SpacedLabel>

      <SpacedLabel htmlFor="login-password">
        Contraseña
        <Field
          autoComplete="current-password"
          id="login-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </SpacedLabel>

      <AuthSubmitButton disabled={submitting} type="submit">
        {submitting ? "Ingresando..." : "Ingresar"}
      </AuthSubmitButton>

      <AuthFormSwitch>
        ¿No tenés cuenta?{" "}
        <ButtonLink onClick={onShowRegister} type="button">
          Crear una cuenta
        </ButtonLink>
      </AuthFormSwitch>
    </AuthForm>
  );
}

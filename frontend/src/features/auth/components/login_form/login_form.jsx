import { useState } from "react";

import { Styles } from "../../../../app/app.styles.jsx";

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
    <Styles.AuthForm aria-labelledby="login-heading" onSubmit={handleSubmit}>
      <Styles.AuthFormHeading id="login-heading">
        Tablero de MRs
      </Styles.AuthFormHeading>

      <Styles.AuthFormDescription>
        Ingresá con tu email para ver el tablero.
      </Styles.AuthFormDescription>

      {error ? (
        <Styles.Alert role="alert">
          {error}
        </Styles.Alert>
      ) : null}

      {notice ? (
        <Styles.Alert $success role="status">
          {notice}
        </Styles.Alert>
      ) : null}

      <Styles.SpacedLabel htmlFor="login-email">
        Email
        <Styles.Field
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
      </Styles.SpacedLabel>

      <Styles.SpacedLabel htmlFor="login-password">
        Contraseña
        <Styles.Field
          autoComplete="current-password"
          id="login-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </Styles.SpacedLabel>

      <Styles.AuthSubmitButton disabled={submitting} type="submit">
        {submitting ? "Ingresando..." : "Ingresar"}
      </Styles.AuthSubmitButton>

      <Styles.AuthFormSwitch>
        ¿No tenés cuenta?{" "}
        <Styles.ButtonLink onClick={onShowRegister} type="button">
          Crear una cuenta
        </Styles.ButtonLink>
      </Styles.AuthFormSwitch>
    </Styles.AuthForm>
  );
}

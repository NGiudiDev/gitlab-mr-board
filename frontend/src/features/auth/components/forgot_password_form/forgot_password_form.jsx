import { useState } from "react";

import { Styles } from "../../../../app/app.styles.jsx";

export function ForgotPasswordForm(props) {
  const {
    error = null,
    notice = null,
    onShowLogin = () => {},
    onSubmit = () => {},
    submitting = false,
  } = props;

  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email: email.trim() });
  }

  return (
    <Styles.AuthForm aria-labelledby="forgot-password-heading" onSubmit={handleSubmit}>
      <Styles.AuthFormHeading id="forgot-password-heading">
        Restablecer contraseña
      </Styles.AuthFormHeading>

      <Styles.AuthFormDescription>
        Ingresá tu email y te enviaremos un enlace para elegir una nueva contraseña.
      </Styles.AuthFormDescription>

      {error ? <Styles.Alert role="alert">{error}</Styles.Alert> : null}
      {notice ? <Styles.Alert $success role="status">{notice}</Styles.Alert> : null}

      <Styles.SpacedLabel htmlFor="forgot-password-email">
        Email
        <Styles.Field
          autoCapitalize="none"
          autoComplete="email"
          id="forgot-password-email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          spellCheck="false"
          type="email"
          value={email}
        />
      </Styles.SpacedLabel>

      <Styles.AuthSubmitButton disabled={submitting} type="submit">
        {submitting ? "Enviando..." : "Enviar enlace"}
      </Styles.AuthSubmitButton>

      <Styles.AuthFormSwitch>
        <Styles.ButtonLink onClick={onShowLogin} type="button">
          Volver al ingreso
        </Styles.ButtonLink>
      </Styles.AuthFormSwitch>
    </Styles.AuthForm>
  );
}

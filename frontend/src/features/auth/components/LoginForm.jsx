import { useState } from "react";

import {
  AUTH_FORM_CLASSES,
  AUTH_FORM_DESCRIPTION_CLASSES,
  AUTH_FORM_HEADING_CLASSES,
  AUTH_FORM_SUBMIT_BUTTON_CLASSES,
  AUTH_FORM_SWITCH_CLASSES,
  BUTTON_LINK_CLASSES,
  ERROR_ALERT_CLASSES,
  FIELD_CLASSES,
  LABEL_CLASSES,
  SUCCESS_ALERT_CLASSES,
} from "../../../app/constants/styles.consts.js";

/**
 * Formulario de ingreso al tablero.
 *
 * El estado de las credenciales es local: sólo lo necesita este componente y
 * no debe sobrevivir al envío.
 */
export function LoginForm({
  error = null,
  notice = null,
  onShowRegister = () => {},
  onSubmit = () => {},
  submitting = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email: email.trim(), password });
  }

  return (
    <form
      aria-labelledby="login-heading"
      className={AUTH_FORM_CLASSES}
      onSubmit={handleSubmit}
    >
      <h1 className={AUTH_FORM_HEADING_CLASSES} id="login-heading">
        Tablero de MRs
      </h1>
      <p className={AUTH_FORM_DESCRIPTION_CLASSES}>Ingresá con tu email para ver el tablero.</p>

      {error ? (
        <p className={ERROR_ALERT_CLASSES} role="alert">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className={SUCCESS_ALERT_CLASSES} role="status">
          {notice}
        </p>
      ) : null}

      <label className={`${LABEL_CLASSES} mb-3`} htmlFor="login-email">
        Email
        <input
          autoCapitalize="none"
          autoComplete="email"
          className={FIELD_CLASSES}
          id="login-email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          spellCheck="false"
          type="text"
          value={email}
        />
      </label>

      <label className={`${LABEL_CLASSES} mb-3`} htmlFor="login-password">
        Contraseña
        <input
          autoComplete="current-password"
          className={FIELD_CLASSES}
          id="login-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <button
        className={AUTH_FORM_SUBMIT_BUTTON_CLASSES}
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Ingresando..." : "Ingresar"}
      </button>

      <p className={AUTH_FORM_SWITCH_CLASSES}>
        ¿No tenés cuenta?{" "}
        <button
          className={BUTTON_LINK_CLASSES}
          onClick={onShowRegister}
          type="button"
        >
          Crear una cuenta
        </button>
      </p>
    </form>
  );
}

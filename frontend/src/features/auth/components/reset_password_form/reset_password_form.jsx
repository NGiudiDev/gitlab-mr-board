import { useState } from "react";

import { Styles } from "../../../../app/app.styles.jsx";
import { MaskedField } from "../../../../app/components/masked_field/masked_field.jsx";

const MINIMUM_PASSWORD_LENGTH = 8;

export function ResetPasswordForm(props) {
  const {
    error = null,
    hasToken = false,
    onShowLogin = () => {},
    onSubmit = () => {},
    submitting = false,
  } = props;

  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState(null);
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmation) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    setLocalError(null);
    onSubmit({ newPassword: password });
  }

  const visibleError = hasToken
    ? localError ?? error
    : "El enlace de restablecimiento es inválido o está incompleto.";

  return (
    <Styles.AuthForm aria-labelledby="reset-password-heading" onSubmit={handleSubmit}>
      <Styles.AuthFormHeading id="reset-password-heading">
        Elegir una nueva contraseña
      </Styles.AuthFormHeading>

      <Styles.AuthFormDescription>
        La nueva contraseña debe tener al menos {MINIMUM_PASSWORD_LENGTH} caracteres.
      </Styles.AuthFormDescription>

      {visibleError ? <Styles.Alert role="alert">{visibleError}</Styles.Alert> : null}

      <MaskedField
        autoComplete="new-password"
        disabled={!hasToken}
        id="reset-password"
        label="Contraseña nueva"
        minLength={MINIMUM_PASSWORD_LENGTH}
        onChange={(event) => setPassword(event.target.value)}
        required
        spaced
        value={password}
        visibilityLabel="contraseña nueva"
      />

      <MaskedField
        autoComplete="new-password"
        disabled={!hasToken}
        id="reset-password-confirmation"
        label="Repetí la contraseña nueva"
        minLength={MINIMUM_PASSWORD_LENGTH}
        onChange={(event) => setConfirmation(event.target.value)}
        required
        spaced
        value={confirmation}
        visibilityLabel="contraseña nueva repetida"
      />

      <Styles.AuthSubmitButton disabled={submitting || !hasToken} type="submit">
        {submitting ? "Guardando..." : "Guardar contraseña"}
      </Styles.AuthSubmitButton>

      <Styles.AuthFormSwitch>
        <Styles.ButtonLink onClick={onShowLogin} type="button">
          Volver al ingreso
        </Styles.ButtonLink>
      </Styles.AuthFormSwitch>
    </Styles.AuthForm>
  );
}

import { useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { MaskedField } from "../../../../design_system/masked_field/masked_field.jsx";

import { RegisterAccountChoice } from "../register_account_choice/register_account_choice.jsx";
import { RegisterTeamFields } from "../register_team_fields/register_team_fields.jsx";

import { MINIMUM_PASSWORD_LENGTH } from "../../constants/auth.consts.js";

export function RegisterForm(props) {
  const {
    error = null,
    onShowLogin = () => {},
    onSubmit = () => {},
    submitting = false,
  } = props;

  const [accountName, setAccountName] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinExisting, setJoinExisting] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [password, setPassword] = useState("");

  const visibleError = localError ?? error;

  function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmation) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    setLocalError(null);

    onSubmit({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      // Sólo viaja el dato del camino elegido: con código el backend ignora el
      // nombre, y sin código no hay cuenta a la que sumarse.
      ...(joinExisting ? { inviteCode: inviteCode.trim() } : { accountName: accountName.trim() }),
    });
  }

  return (
    <AppStyles.AuthForm aria-labelledby="registro-heading" onSubmit={handleSubmit}>
      <AppStyles.AuthFormHeading id="registro-heading">
        Crear una cuenta
      </AppStyles.AuthFormHeading>

      <AppStyles.AuthFormDescription>
        Ingresá tu email y una contraseña de al menos {MINIMUM_PASSWORD_LENGTH} caracteres.
      </AppStyles.AuthFormDescription>

      {visibleError ? (
        <AppStyles.Alert role="alert">
          {visibleError}
        </AppStyles.Alert>
      ) : null}

      <RegisterAccountChoice joinExisting={joinExisting} onChange={setJoinExisting} />

      <RegisterTeamFields
        accountName={accountName}
        inviteCode={inviteCode}
        joinExisting={joinExisting}
        onAccountNameChange={setAccountName}
        onInviteCodeChange={setInviteCode}
      />

      <AppStyles.SpacedLabel htmlFor="registro-email">
        Email
        <AppStyles.Field
          autoCapitalize="none"
          autoComplete="email"
          id="registro-email"
          maxLength={254}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          spellCheck="false"
          type="email"
          value={email}
        />
      </AppStyles.SpacedLabel>

      <AppStyles.SpacedLabel htmlFor="registro-nombre">
        Nombre visible (opcional)
        <AppStyles.Field
          autoComplete="name"
          id="registro-nombre"
          maxLength={80}
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          type="text"
          value={displayName}
        />
      </AppStyles.SpacedLabel>

      <MaskedField
        autoComplete="new-password"
        id="registro-password"
        label="Contraseña"
        minLength={MINIMUM_PASSWORD_LENGTH}
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        required
        spaced
        value={password}
      />

      <MaskedField
        autoComplete="new-password"
        id="registro-confirmacion"
        label="Repetí la contraseña"
        minLength={MINIMUM_PASSWORD_LENGTH}
        name="passwordConfirmation"
        onChange={(event) => setConfirmation(event.target.value)}
        required
        spaced
        value={confirmation}
        visibilityLabel="contraseña repetida"
      />

      <AppStyles.AuthSubmitButton disabled={submitting} type="submit">
        {submitting ? "Creando la cuenta..." : "Crear cuenta"}
      </AppStyles.AuthSubmitButton>

      <AppStyles.AuthFormSwitch>
        ¿Ya tenés cuenta?{" "}
        <AppStyles.ButtonLink onClick={onShowLogin} type="button">
          Ingresar
        </AppStyles.ButtonLink>
      </AppStyles.AuthFormSwitch>
    </AppStyles.AuthForm>
  );
}

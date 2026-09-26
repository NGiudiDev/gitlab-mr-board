import { useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./register_form.style.js";

//TODO: Pasar esta constante a un archivo de constantes.
const MINIMUM_PASSWORD_LENGTH = 8;

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

  const visibleError = localError ?? error;

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

      <Styles.ChoiceFieldset>
        <Styles.ChoiceLegend>
          ¿Cómo querés entrar?
        </Styles.ChoiceLegend>
        <Styles.ChoiceGroup>
          <Styles.ChoiceButton
            $active={joinExisting}
            aria-pressed={joinExisting}
            onClick={() => setJoinExisting(true)}
            type="button"
          >
            Sumarme a un equipo
          </Styles.ChoiceButton>
          <Styles.ChoiceButton
            $active={!joinExisting}
            aria-pressed={!joinExisting}
            onClick={() => setJoinExisting(false)}
            type="button"
          >
            Crear un equipo
          </Styles.ChoiceButton>
        </Styles.ChoiceGroup>
      </Styles.ChoiceFieldset>

      {joinExisting ? (
        <>
          <AppStyles.SpacedLabel htmlFor="registro-invitacion">
            Código de invitación
            <AppStyles.Field
              aria-describedby="registro-invitacion-ayuda"
              autoCapitalize="characters"
              id="registro-invitacion"
              name="inviteCode"
              onChange={(event) => setInviteCode(event.target.value)}
              required
              spellCheck="false"
              type="text"
              value={inviteCode}
            />
          </AppStyles.SpacedLabel>
          <Styles.RegisterHint id="registro-invitacion-ayuda">
            Te lo da quien administra el tablero de tu equipo. Con él ves los mismos proyectos, sin cargar credenciales de GitLab.
          </Styles.RegisterHint>
        </>
      ) : (
        <>
          <AppStyles.SpacedLabel htmlFor="registro-cuenta">
            Nombre del equipo (opcional)
            <AppStyles.Field
              aria-describedby="registro-cuenta-ayuda"
              id="registro-cuenta"
              maxLength={80}
              name="accountName"
              onChange={(event) => setAccountName(event.target.value)}
              type="text"
              value={accountName}
            />
          </AppStyles.SpacedLabel>
          <Styles.RegisterHint id="registro-cuenta-ayuda">
            Vas a quedar administrador: cargás una vez los proyectos y el access token de GitLab, y el resto del equipo se suma con un código.
          </Styles.RegisterHint>
        </>
      )}

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

      <AppStyles.SpacedLabel htmlFor="registro-password">
        Contraseña
        <AppStyles.Field
          autoComplete="new-password"
          id="registro-password"
          minLength={MINIMUM_PASSWORD_LENGTH}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </AppStyles.SpacedLabel>

      <AppStyles.SpacedLabel htmlFor="registro-confirmacion">
        Repetí la contraseña
        <AppStyles.Field
          autoComplete="new-password"
          id="registro-confirmacion"
          minLength={MINIMUM_PASSWORD_LENGTH}
          name="passwordConfirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </AppStyles.SpacedLabel>

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

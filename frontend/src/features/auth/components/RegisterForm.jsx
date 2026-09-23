import { useState } from "react";
import styled from "styled-components";

import {
  Alert,
  AuthForm,
  AuthFormDescription,
  AuthFormHeading,
  AuthFormSwitch,
  AuthSubmitButton,
  ButtonLink,
  Field,
  focusRingStyles,
  SpacedLabel,
} from "../../../app/constants/styles.consts.js";

const ChoiceFieldset = styled.fieldset`
  margin: 0 0 1rem;
  padding: 0;
  border: 0;
`;

const ChoiceLegend = styled.legend`
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const ChoiceGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ChoiceButton = styled.button`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $active }) => $active ? "var(--color-accent)" : "var(--color-control)"};
  border-radius: 0.375rem;
  background: ${({ $active }) => $active ? "var(--color-surface-raised)" : "transparent"};
  color: ${({ $active }) => $active ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  font-size: 0.78125rem;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  cursor: pointer;

  &:hover {
    color: var(--color-text-primary);
  }

  ${focusRingStyles}
`;

const RegisterHint = styled.p`
  margin: -0.5rem 0 0.75rem;
  color: var(--color-text-faint);
  font-size: 0.71875rem;
`;

const MINIMUM_PASSWORD_LENGTH = 8;

export function RegisterForm(props) {
  const { error = null, onShowLogin = () => {}, onSubmit = () => {}, submitting = false } = props;

  const [joinExisting, setJoinExisting] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState(null);

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
    <AuthForm aria-labelledby="registro-heading" onSubmit={handleSubmit}>
      <AuthFormHeading id="registro-heading">
        Crear una cuenta
      </AuthFormHeading>

      <AuthFormDescription>
        Ingresá tu email y una contraseña de al menos {MINIMUM_PASSWORD_LENGTH} caracteres.
      </AuthFormDescription>

      {visibleError ? (
        <Alert role="alert">
          {visibleError}
        </Alert>
      ) : null}

      <ChoiceFieldset>
        <ChoiceLegend>
          ¿Cómo querés entrar?
        </ChoiceLegend>
        <ChoiceGroup>
          <ChoiceButton
            $active={joinExisting}
            aria-pressed={joinExisting}
            onClick={() => setJoinExisting(true)}
            type="button"
          >
            Sumarme a un equipo
          </ChoiceButton>
          <ChoiceButton
            $active={!joinExisting}
            aria-pressed={!joinExisting}
            onClick={() => setJoinExisting(false)}
            type="button"
          >
            Crear un equipo
          </ChoiceButton>
        </ChoiceGroup>
      </ChoiceFieldset>

      {joinExisting ? (
        <>
          <SpacedLabel htmlFor="registro-invitacion">
            Código de invitación
            <Field
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
          </SpacedLabel>
          <RegisterHint id="registro-invitacion-ayuda">
            Te lo da quien administra el tablero de tu equipo. Con él ves los mismos proyectos, sin cargar credenciales de GitLab.
          </RegisterHint>
        </>
      ) : (
        <>
          <SpacedLabel htmlFor="registro-cuenta">
            Nombre del equipo (opcional)
            <Field
              aria-describedby="registro-cuenta-ayuda"
              id="registro-cuenta"
              maxLength={80}
              name="accountName"
              onChange={(event) => setAccountName(event.target.value)}
              type="text"
              value={accountName}
            />
          </SpacedLabel>
          <RegisterHint id="registro-cuenta-ayuda">
            Vas a quedar administrador: cargás una vez los proyectos y el access token de GitLab, y el resto del equipo se suma con un código.
          </RegisterHint>
        </>
      )}

      <SpacedLabel htmlFor="registro-email">
        Email
        <Field
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
      </SpacedLabel>

      <SpacedLabel htmlFor="registro-nombre">
        Nombre visible (opcional)
        <Field
          autoComplete="name"
          id="registro-nombre"
          maxLength={80}
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          type="text"
          value={displayName}
        />
      </SpacedLabel>

      <SpacedLabel htmlFor="registro-password">
        Contraseña
        <Field
          autoComplete="new-password"
          id="registro-password"
          minLength={MINIMUM_PASSWORD_LENGTH}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </SpacedLabel>

      <SpacedLabel htmlFor="registro-confirmacion">
        Repetí la contraseña
        <Field
          autoComplete="new-password"
          id="registro-confirmacion"
          minLength={MINIMUM_PASSWORD_LENGTH}
          name="passwordConfirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </SpacedLabel>

      <AuthSubmitButton disabled={submitting} type="submit">
        {submitting ? "Creando la cuenta..." : "Crear cuenta"}
      </AuthSubmitButton>

      <AuthFormSwitch>
        ¿Ya tenés cuenta?{" "}
        <ButtonLink onClick={onShowLogin} type="button">
          Ingresar
        </ButtonLink>
      </AuthFormSwitch>
    </AuthForm>
  );
}

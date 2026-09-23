import { useState } from "react";

import {
  Alert,
  Button,
  Field,
  SectionDescription,
  SectionHeading,
  SpacedLabel,
} from "../../../app/constants/styles.consts.js";

export function PasswordPanel(props) {
  const { onChangePassword = () => {}, submitting = false, user = null } = props;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError(null);
    setError(await onChangePassword({ currentPassword, newPassword }));
  }

  if (!user) return null;

  return (
    <section aria-labelledby="contrasena-heading">
      <SectionHeading id="contrasena-heading">
        Mi contraseña
      </SectionHeading>

      <SectionDescription>
        Al cambiarla se cierran todas tus sesiones, así que vas a tener que ingresar de nuevo.
      </SectionDescription>

      {error ? (
        <Alert role="alert">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        <SpacedLabel htmlFor="cuenta-actual">
          Contraseña actual
          <Field
            autoComplete="current-password"
            id="cuenta-actual"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </SpacedLabel>

        <SpacedLabel htmlFor="cuenta-nueva">
          Contraseña nueva
          <Field
            autoComplete="new-password"
            id="cuenta-nueva"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </SpacedLabel>

        <SpacedLabel htmlFor="cuenta-confirmacion">
          Repetí la contraseña nueva
          <Field
            autoComplete="new-password"
            id="cuenta-confirmacion"
            minLength={8}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            type="password"
            value={confirmation}
          />
        </SpacedLabel>

        <Button disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Cambiar contraseña"}
        </Button>
      </form>
    </section>
  );
}

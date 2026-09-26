import { useState } from "react";

import { Styles } from "../../../app/app.styles.jsx";

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
      <Styles.SectionHeading id="contrasena-heading">
        Mi contraseña
      </Styles.SectionHeading>

      <Styles.SectionDescription>
        Al cambiarla se cierran todas tus sesiones, así que vas a tener que ingresar de nuevo.
      </Styles.SectionDescription>

      {error ? (
        <Styles.Alert role="alert">
          {error}
        </Styles.Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Styles.SpacedLabel htmlFor="cuenta-actual">
          Contraseña actual
          <Styles.Field
            autoComplete="current-password"
            id="cuenta-actual"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </Styles.SpacedLabel>

        <Styles.SpacedLabel htmlFor="cuenta-nueva">
          Contraseña nueva
          <Styles.Field
            autoComplete="new-password"
            id="cuenta-nueva"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </Styles.SpacedLabel>

        <Styles.SpacedLabel htmlFor="cuenta-confirmacion">
          Repetí la contraseña nueva
          <Styles.Field
            autoComplete="new-password"
            id="cuenta-confirmacion"
            minLength={8}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            type="password"
            value={confirmation}
          />
        </Styles.SpacedLabel>

        <Styles.Button disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Cambiar contraseña"}
        </Styles.Button>
      </form>
    </section>
  );
}

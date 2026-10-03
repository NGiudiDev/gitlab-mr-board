import { useState } from "react";

import { MaskedField } from "../../../../app/components/masked_field/masked_field.jsx";

import { Styles } from "../../../../app/app.styles.jsx";

export function PasswordPanel(props) {
  const { onChangePassword = () => {}, submitting = false, user = null } = props;

  const [confirmation, setConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState(null);
  const [newPassword, setNewPassword] = useState("");

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
        <MaskedField
          autoComplete="current-password"
          id="cuenta-actual"
          label="Contraseña actual"
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          spaced
          value={currentPassword}
          visibilityLabel="contraseña actual"
        />

        <MaskedField
          autoComplete="new-password"
          id="cuenta-nueva"
          label="Contraseña nueva"
          minLength={8}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          spaced
          value={newPassword}
          visibilityLabel="contraseña nueva"
        />

        <MaskedField
          autoComplete="new-password"
          id="cuenta-confirmacion"
          label="Repetí la contraseña nueva"
          minLength={8}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          spaced
          value={confirmation}
          visibilityLabel="contraseña nueva repetida"
        />

        <Styles.Button disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Cambiar contraseña"}
        </Styles.Button>
      </form>
    </section>
  );
}

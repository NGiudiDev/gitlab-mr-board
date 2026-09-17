import { useState } from "react";

import {
  ERROR_ALERT_CLASSES,
  FIELD_CLASSES,
  LABEL_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECTION_DESCRIPTION_CLASSES,
  SECTION_HEADING_CLASSES,
} from "../../../app/constants/styles.consts.js";

/**
 * Cambio de la propia contraseña, pidiendo la actual como confirmación.
 *
 * Es una de las tarjetas de «Mi perfil»; los datos compartidos de la cuenta y
 * la administración de usuarios son sus propios componentes.
 *
 * El estado de las contraseñas es local: sólo lo necesita esta pantalla y no
 * debe sobrevivir al envío.
 */
export function PasswordPanel({ onChangePassword = () => {}, submitting = false, user = null }) {
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
      <h2 className={SECTION_HEADING_CLASSES} id="contrasena-heading">
        Mi contraseña
      </h2>
      <p className={SECTION_DESCRIPTION_CLASSES}>
        Al cambiarla se cierran todas tus sesiones, así que vas a tener que ingresar de nuevo.
      </p>

      {error ? (
        <p className={ERROR_ALERT_CLASSES} role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <label className={`${LABEL_CLASSES} mb-3`} htmlFor="cuenta-actual">
          Contraseña actual
          <input
            autoComplete="current-password"
            className={FIELD_CLASSES}
            id="cuenta-actual"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
        </label>

        <label className={`${LABEL_CLASSES} mb-3`} htmlFor="cuenta-nueva">
          Contraseña nueva
          <input
            autoComplete="new-password"
            className={FIELD_CLASSES}
            id="cuenta-nueva"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </label>

        <label className={`${LABEL_CLASSES} mb-3`} htmlFor="cuenta-confirmacion">
          Repetí la contraseña nueva
          <input
            autoComplete="new-password"
            className={FIELD_CLASSES}
            id="cuenta-confirmacion"
            minLength={8}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            type="password"
            value={confirmation}
          />
        </label>

        <button
          className={PRIMARY_BUTTON_CLASSES}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </section>
  );
}

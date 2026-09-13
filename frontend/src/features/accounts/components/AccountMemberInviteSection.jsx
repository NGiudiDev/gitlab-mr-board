// Revisado 12/09
import { useState } from "react";

import {
  FIELD_CLASSES,
  HINT_CLASSES,
  LABEL_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "../../../assets/constants.js";

export function AccountMemberInviteSection({
  inviteCode = "",
  onRotate = async () => null,
  submitting = false,
}) {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleRotate() {
    setError(null);
    setMessage(null);

    try {
      const failure = await onRotate();

      if (failure) {
        setError(failure);
        return;
      }

      setMessage("Código de invitación renovado.");
    } catch {
      setError("No se pudo renovar el código de invitación.");
    }
  }

  return (
    <section aria-labelledby="invitacion-heading">
      <h2 className="mb-1 text-base font-semibold text-text-primary" id="invitacion-heading">
        Invitar al equipo
      </h2>

      <p className="mb-3 text-[12.5px] text-text-muted">
        Quien se registre con este código entra a esta cuenta y ve el mismo tablero, sin cargar ninguna credencial de GitLab.
      </p>

      {error ? (
        <p className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary" role="status">
          {message}
        </p>
      ) : null}

      <div className="mb-3">
        <label className={LABEL_CLASSES} htmlFor="cuenta-invitacion">
          Código de invitación
        </label>

        <input
          className={`${FIELD_CLASSES} font-mono tracking-widest`}
          id="cuenta-invitacion"
          readOnly
          type="text"
          value={inviteCode}
        />
      </div>

      <button
        className={SECONDARY_BUTTON_CLASSES}
        disabled={submitting}
        onClick={handleRotate}
        type="button"
      >
        {submitting ? "Renovando..." : "Renovar el código"}
      </button>

      <p className={HINT_CLASSES}>
        Al renovarlo, el código anterior deja de servir. Quien ya se sumó no pierde el acceso.
      </p>
    </section>
  );
}

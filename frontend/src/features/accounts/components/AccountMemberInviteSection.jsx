// 2. Dependencias externas.
import { useState } from "react";

const FIELD_CLASSES = "block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const HINT_CLASSES = "mt-1 text-[12px] font-normal text-text-faint";
const LABEL_CLASSES = "block text-[12px] font-semibold text-text-muted";
const SECONDARY_BUTTON_CLASSES = "rounded-md border border-control px-3 py-2 text-[12.5px] text-text-primary hover:border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Presenta el código con el que una persona puede sumarse a la cuenta.
 *
 * @param {object} props Propiedades de la sección.
 * @param {string} [props.inviteCode] Código vigente de la cuenta.
 * @param {boolean} [props.submitting] Indica si se está renovando el código.
 * @param {() => Promise<string | null>} [props.onRotate] Solicita renovar el código.
 * @returns {import("react").ReactElement} Sección de invitación.
 */
export function AccountMemberInviteSection({
  inviteCode = "",
  submitting = false,
  onRotate = async () => null,
}) {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  /** Renueva el código y comunica el resultado sin abandonar la sección. */
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
      <h2 id="invitacion-heading" className="mb-1 text-base font-semibold text-text-primary">
        Invitar al equipo
      </h2>

      <p className="mb-3 text-[12.5px] text-text-muted">
        Quien se registre con este código entra a esta cuenta y ve el mismo tablero, sin cargar ninguna credencial de GitLab.
      </p>

      {error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {message}
        </p>
      ) : null}

      <div className="mb-3">
        <label className={LABEL_CLASSES} htmlFor="cuenta-invitacion">
          Código de invitación
        </label>

        <input
          id="cuenta-invitacion"
          type="text"
          value={inviteCode}
          readOnly
          className={`${FIELD_CLASSES} font-mono tracking-widest`}
        />
      </div>

      <button
        type="button"
        onClick={handleRotate}
        disabled={submitting}
        className={SECONDARY_BUTTON_CLASSES}
      >
        {submitting ? "Renovando..." : "Renovar el código"}
      </button>

      <p className={HINT_CLASSES}>
        Al renovarlo, el código anterior deja de servir. Quien ya se sumó no pierde el acceso.
      </p>
    </section>
  );
}

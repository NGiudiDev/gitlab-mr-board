// Revisado 12/09
import { useEffect, useState } from "react";

import {
  BUTTON_CLASSES,
  FIELD_CLASSES,
  HINT_CLASSES,
  LABEL_CLASSES,
} from "../../../assets/constants.js";

import { renameAccount } from "../hooks/useAccount.js";

/** Describe la cantidad de integrantes con singular y plural correctos. */
function membersLabel(memberCount) {
  return memberCount === 1 ? "1 persona" : `${memberCount} personas`;
}

export function AccountSettingsSection({ account = null }) {
  const [formError, setFormError] = useState(null);
  const [message, setMessage] = useState(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // La cuenta llega después del primer render, así que el campo se completa
  // recién cuando el backend responde.
  useEffect(() => {
    setName(account?.name ?? "");
  }, [account]);

  // El backend sólo devuelve el código de invitación a un administrador.
  const canEdit = Boolean(account?.inviteCode);

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const failure = await renameAccount(name);

      if (failure) {
        setFormError(failure);
        return;
      }

      setMessage("Nombre de la cuenta actualizado.");
    } catch {
      setFormError("No se pudo conectar al backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="cuenta-heading">
      <h2 className="text-base font-semibold text-text-primary mb-1" id="cuenta-heading">
        Mi cuenta
      </h2>

      <p className="text-[12.5px] text-text-muted mb-4">
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
      </p>

      {formError ? (
        <p className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary" role="alert">
          {formError}
        </p>
      ) : null}

      {message ? (
        <p className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary" role="status">
          {message}
        </p>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={LABEL_CLASSES} htmlFor="cuenta-nombre">
              Nombre de la cuenta
            </label>

            <input
              aria-describedby="cuenta-nombre-ayuda"
              className={FIELD_CLASSES}
              id="cuenta-nombre"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />

            <p className={HINT_CLASSES} id="cuenta-nombre-ayuda">
              La integran {membersLabel(account.memberCount)}.
            </p>
          </div>

          <button className={BUTTON_CLASSES} disabled={submitting} type="submit">
            {submitting ? "Guardando..." : "Guardar el nombre"}
          </button>
        </form>
      ) : (
        <dl className="text-[13px]">
          <dt className={LABEL_CLASSES}>Cuenta</dt>
          <dd className="mb-3 mt-1 text-text-primary">{account.name}</dd>

          <dt className={LABEL_CLASSES}>Integrantes</dt>
          <dd className="mt-1 text-text-primary">{membersLabel(account.memberCount)}</dd>
        </dl>
      )}
    </section>
  );
}

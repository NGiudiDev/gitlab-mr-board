// 2. Dependencias externas.
import { useEffect, useState } from "react";

// 4. Módulos de constantes.
import {
  BUTTON_CLASSES,
  FIELD_CLASSES,
  HINT_CLASSES,
  LABEL_CLASSES,
} from "../../../assets/constants.js";

// 6. Imports relativos restantes.
import { useAccount } from "../hooks/useAccount.js";

/** Describe la cantidad de miembros sin dejar el número suelto. */
function membersLabel(memberCount) {
  return memberCount === 1 ? "1 persona" : `${memberCount} personas`;
}

/**
 * Datos de la cuenta que comparte el tablero: su nombre y cuánta gente la
 * integra.
 *
 * El nombre lo edita sólo un administrador; el backend valida el rol.
 */
export function AccountSettingsSection({ user = null }) {
  const { account, loading, error, submitting, renameAccount } = useAccount(user?.accountId ?? null);

  const [formError, setFormError] = useState(null);
  const [message, setMessage] = useState(null);
  const [name, setName] = useState("");

  // La cuenta llega después del primer render, así que el campo se completa
  // recién cuando el backend responde.
  useEffect(() => {
    setName(account?.name ?? "");
  }, [account]);

  const isAdmin = user?.role === "admin";

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError(null);
    setMessage(null);

    const failure = await renameAccount(name);

    if (failure) {
      setFormError(failure);
      return;
    }

    setMessage("Nombre de la cuenta actualizado.");
  }

  if (!user) return null;

  return (
    <section aria-labelledby="cuenta-heading">
      <h2 id="cuenta-heading" className="text-base font-semibold text-text-primary mb-1">
        Mi cuenta
      </h2>

      <p className="text-[12.5px] text-text-muted mb-4">
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
      </p>

      {formError || error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {formError ?? error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {message}
        </p>
      ) : null}

      {loading && !account ? (
        <p role="status" className="text-[13px] text-text-muted">Cargando la cuenta...</p>
      ) : !account ? null : (
        <>
          {isAdmin ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={LABEL_CLASSES} htmlFor="cuenta-nombre">
                  Nombre de la cuenta
                </label>

                <input
                  id="cuenta-nombre"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                  aria-describedby="cuenta-nombre-ayuda"
                  className={FIELD_CLASSES}
                />

                <p id="cuenta-nombre-ayuda" className={HINT_CLASSES}>
                  La integran {membersLabel(account.memberCount)}.
                </p>
              </div>

              <button type="submit" disabled={submitting} className={BUTTON_CLASSES}>
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
        </>
      )}
    </section>
  );
}

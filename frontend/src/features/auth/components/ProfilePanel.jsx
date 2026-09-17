import { useEffect, useState } from "react";

import {
  FIELD_CLASSES,
  LABEL_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECTION_DESCRIPTION_CLASSES,
  SECTION_HEADING_CLASSES,
} from "../../../app/constants/styles.consts.js";

/**
 * Permite editar el nombre visible y el email de la propia persona.
 */
export function ProfilePanel({
  onSave = async () => null,
  submitting = false,
  user = null,
}) {
  const [profile, setProfile] = useState({ displayName: "", email: "" });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setProfile({
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
    });
  }, [user?.displayName, user?.email]);

  if (!user) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const failure = await onSave({
      displayName: profile.displayName.trim(),
      email: profile.email.trim(),
    });

    if (failure) {
      setError(failure);
      return;
    }

    setNotice("Perfil actualizado.");
  }

  return (
    <section aria-labelledby="perfil-heading">
      <h2 className={SECTION_HEADING_CLASSES} id="perfil-heading">
        Mi perfil
      </h2>
      <p className={SECTION_DESCRIPTION_CLASSES}>
        Estos datos identifican tu sesión. Si cambiás el email, usá el nuevo la próxima vez que ingreses.
      </p>

      <form onSubmit={handleSubmit}>
        <label className={`${LABEL_CLASSES} mb-3`} htmlFor="perfil-email">
          Email
          <input
            autoCapitalize="none"
            autoComplete="email"
            className={FIELD_CLASSES}
            disabled={submitting}
            id="perfil-email"
            maxLength={254}
            name="email"
            onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
            required
            spellCheck="false"
            type="email"
            value={profile.email}
          />
        </label>

        <label className={`${LABEL_CLASSES} mb-1`} htmlFor="perfil-display-name">
          Nombre visible
          <input
            autoComplete="name"
            className={FIELD_CLASSES}
            disabled={submitting}
            id="perfil-display-name"
            name="displayName"
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            type="text"
            value={profile.displayName}
          />
        </label>

        {error ? <p className="mt-3 text-xs text-conflict" role="alert">{error}</p> : null}
        
        {notice ? <p className="mt-3 text-xs text-ready" role="status">{notice}</p> : null}

        <button
          className={`${PRIMARY_BUTTON_CLASSES} mt-4`}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Guardando…" : "Guardar perfil"}
        </button>
      </form>
    </section>
  );
}

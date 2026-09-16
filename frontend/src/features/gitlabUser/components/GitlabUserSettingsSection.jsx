import { useEffect, useState } from "react";

import {
  BUTTON_CLASSES,
  FIELD_CLASSES,
  HINT_CLASSES,
  LABEL_CLASSES,
} from "../../../assets/constants.js";

/**
 * Nickname de GitLab de la propia persona.
 *
 * Es lo único de GitLab que carga cada uno: el token y los proyectos son de la
 * cuenta, pero con qué nombre aparece cada persona en los merge requests es
 * suyo, y de eso depende la vista personal.
 */
export function GitlabUserSettingsSection({ onSave = () => {}, submitting = false, user = null }) {
  const [gitlabUsername, setGitlabUsername] = useState(user?.gitlabUsername ?? "");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // La sesión puede llegar después del primer render, y también cambia al
  // guardar: el campo sigue a lo que dice el backend.
  useEffect(() => {
    setGitlabUsername(user?.gitlabUsername ?? "");
  }, [user?.gitlabUsername]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const failure = await onSave(gitlabUsername.trim());

    if (failure) {
      setError(failure);
      return;
    }

    setMessage("Nickname de GitLab guardado.");
  }

  if (!user) return null;

  return (
    <section aria-labelledby="identidad-heading">
      <h2 className="text-base font-semibold text-text-primary mb-1" id="identidad-heading">
        Usuario de GitLab
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        Con tu nickname el tablero reconoce cuáles de los merge requests del equipo son tuyos.
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

      <form onSubmit={handleSubmit}>
        {/* La ayuda queda fuera del `label` para que no forme parte del nombre
            accesible del campo; `aria-describedby` la asocia igual. */}
        <div className="mb-4">
          <label className={LABEL_CLASSES} htmlFor="identidad-nickname">
            Nickname de GitLab
          </label>
          <input
            aria-describedby="identidad-nickname-ayuda"
            autoCapitalize="none"
            className={FIELD_CLASSES}
            id="identidad-nickname"
            onChange={(event) => setGitlabUsername(event.target.value)}
            required
            spellCheck="false"
            type="text"
            value={gitlabUsername}
          />
          <p className={HINT_CLASSES} id="identidad-nickname-ayuda">
            Tu nombre de usuario en GitLab, sin la arroba.
          </p>
        </div>

        <button
          className={BUTTON_CLASSES}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Guardando..." : "Guardar mi nickname"}
        </button>
      </form>
    </section>
  );
}


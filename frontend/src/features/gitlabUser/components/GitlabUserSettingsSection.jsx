import { useEffect, useState } from "react";

import {
  ERROR_ALERT_CLASSES,
  FIELD_CLASSES,
  HINT_CLASSES,
  LABEL_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECTION_DESCRIPTION_CLASSES,
  SECTION_HEADING_CLASSES,
  SUCCESS_ALERT_CLASSES,
} from "../../../app/constants/styles.consts.js";

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
      <h2 className={SECTION_HEADING_CLASSES} id="identidad-heading">
        Usuario de GitLab
      </h2>
      <p className={SECTION_DESCRIPTION_CLASSES}>
        Con tu nickname el tablero reconoce cuáles de los merge requests del equipo son tuyos.
      </p>

      {error ? (
        <p className={ERROR_ALERT_CLASSES} role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className={SUCCESS_ALERT_CLASSES} role="status">
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
          className={PRIMARY_BUTTON_CLASSES}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Guardando..." : "Guardar mi nickname"}
        </button>
      </form>
    </section>
  );
}


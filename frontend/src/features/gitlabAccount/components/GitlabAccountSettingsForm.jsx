import { useEffect, useState } from "react";

import {
  ERROR_ALERT_CLASSES,
  FIELD_CLASSES,
  HINT_CLASSES,
  LABEL_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SUCCESS_ALERT_CLASSES,
} from "../../../app/constants/styles.consts.js";

/**
 * Edita los proyectos y el access token compartidos por la cuenta.
 *
 * @param {object} props Propiedades del formulario.
 * @param {object | null} [props.settings] Configuración actualmente guardada.
 * @param {boolean} [props.saving] Indica si el guardado está en curso.
 * @param {Function} [props.save] Persiste los valores ingresados.
 * @param {Function} [props.onSaved] Avisa que el guardado terminó correctamente.
 * @returns {import("react").ReactElement} Formulario de configuración de GitLab.
 */
export function GitlabAccountSettingsForm({
  onSaved = () => {},
  save = async () => null,
  saving = false,
  settings = null,
}) {
  const [accessToken, setAccessToken] = useState("");
  const [formError, setFormError] = useState(null);
  const [message, setMessage] = useState(null);
  const [projectIds, setProjectIds] = useState("");

  // La configuración llega después del primer render, así que los campos se
  // completan recién cuando el backend responde.
  useEffect(() => {
    setProjectIds(settings?.projectIds.join(", ") ?? "");
  }, [settings]);

  const hasStoredToken = Boolean(settings?.tokenHint);

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError(null);
    setMessage(null);

    const failure = await save({ projectIds, accessToken: accessToken.trim() });

    if (failure) {
      setFormError(failure);
      return;
    }

    // El token guardado no se recupera, así que el campo vuelve a quedar vacío.
    setAccessToken("");
    setMessage("Configuración de GitLab guardada.");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit}>
      {formError ? (
        <p className={ERROR_ALERT_CLASSES} role="alert">
          {formError}
        </p>
      ) : null}

      {message ? (
        <p className={SUCCESS_ALERT_CLASSES} role="status">
          {message}
        </p>
      ) : null}

      <div className="mb-4">
        <label className={LABEL_CLASSES} htmlFor="gitlab-proyectos">
          IDs de los proyectos
        </label>

        <input
          aria-describedby="gitlab-proyectos-ayuda"
          className={FIELD_CLASSES}
          id="gitlab-proyectos"
          inputMode="numeric"
          onChange={(event) => setProjectIds(event.target.value)}
          required
          spellCheck="false"
          type="text"
          value={projectIds}
        />

        <p className={HINT_CLASSES} id="gitlab-proyectos-ayuda">
          Números separados por comas, por ejemplo 123, 456. Los encontrás en la portada de cada proyecto en GitLab.
        </p>
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASSES} htmlFor="gitlab-token">
          Access token
        </label>

        <input
          aria-describedby="gitlab-token-ayuda"
          autoComplete="off"
          className={FIELD_CLASSES}
          id="gitlab-token"
          onChange={(event) => setAccessToken(event.target.value)}
          required={!hasStoredToken}
          spellCheck="false"
          type="password"
          value={accessToken}
        />
        <p className={HINT_CLASSES} id="gitlab-token-ayuda">
          {hasStoredToken
            ? `Ya hay uno guardado, terminado en «${settings.tokenHint}». Dejá el campo vacío para conservarlo.`
            : "PAT de GitLab con el alcance read_api. Se guarda cifrado y no se muestra nunca más."}
        </p>
      </div>

      <button
        className={PRIMARY_BUTTON_CLASSES}
        disabled={saving}
        type="submit"
      >
        {saving ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}

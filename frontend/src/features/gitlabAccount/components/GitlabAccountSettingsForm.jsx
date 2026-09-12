// 2. Dependencias externas.
import { useEffect, useState } from "react";

// 6. Imports relativos restantes.
import { FIELD_CLASSES, HINT_CLASSES, LABEL_CLASSES } from "../../../assets/constants.js";

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
export function GitlabAccountSettingsForm(props) {
  const {
    settings = null,
    saving = false,
    save = async () => null,
    onSaved = () => {},
  } = props;

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
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {formError}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {message}
        </p>
      ) : null}

      <div className="mb-4">
        <label className={LABEL_CLASSES} htmlFor="gitlab-proyectos">
          IDs de los proyectos
        </label>

        <input
          id="gitlab-proyectos"
          type="text"
          value={projectIds}
          onChange={(event) => setProjectIds(event.target.value)}
          inputMode="numeric"
          spellCheck="false"
          required
          aria-describedby="gitlab-proyectos-ayuda"
          className={FIELD_CLASSES}
        />

        <p id="gitlab-proyectos-ayuda" className={HINT_CLASSES}>
          Números separados por comas, por ejemplo 123, 456. Los encontrás en la portada de cada proyecto en GitLab.
        </p>
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASSES} htmlFor="gitlab-token">
          Access token
        </label>

        <input
          id="gitlab-token"
          type="password"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          autoComplete="off"
          spellCheck="false"
          required={!hasStoredToken}
          aria-describedby="gitlab-token-ayuda"
          className={FIELD_CLASSES}
        />
        <p id="gitlab-token-ayuda" className={HINT_CLASSES}>
          {hasStoredToken
            ? `Ya hay uno guardado, terminado en «${settings.tokenHint}». Dejá el campo vacío para conservarlo.`
            : "PAT de GitLab con el alcance read_api. Se guarda cifrado y no se muestra nunca más."}
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {saving ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}

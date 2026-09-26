import { useEffect, useState } from "react";

import { Styles } from "../../../app/app.styles.jsx";

export function GitlabAccountSettingsForm(props) {
  const {
    onSaved = () => {},
    save = async () => null,
    saving = false,
    settings = null,
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
        <Styles.Alert role="alert">
          {formError}
        </Styles.Alert>
      ) : null}

      {message ? (
        <Styles.Alert $success role="status">
          {message}
        </Styles.Alert>
      ) : null}

      <Styles.FormField>
        <Styles.Label htmlFor="gitlab-proyectos">
          IDs de los proyectos
        </Styles.Label>

        <Styles.Field
          aria-describedby="gitlab-proyectos-ayuda"
          id="gitlab-proyectos"
          inputMode="numeric"
          onChange={(event) => setProjectIds(event.target.value)}
          required
          spellCheck="false"
          type="text"
          value={projectIds}
        />

        <Styles.Hint id="gitlab-proyectos-ayuda">
          Números separados por comas, por ejemplo 123, 456. Los encontrás en la portada de cada proyecto en GitLab.
        </Styles.Hint>
      </Styles.FormField>

      <Styles.FormField>
        <Styles.Label htmlFor="gitlab-token">
          Access token
        </Styles.Label>

        <Styles.Field
          aria-describedby="gitlab-token-ayuda"
          autoComplete="off"
          id="gitlab-token"
          onChange={(event) => setAccessToken(event.target.value)}
          required={!hasStoredToken}
          spellCheck="false"
          type="password"
          value={accessToken}
        />
        <Styles.Hint id="gitlab-token-ayuda">
          {hasStoredToken
            ? `Ya hay uno guardado, terminado en «${settings.tokenHint}». Dejá el campo vacío para conservarlo.`
            : "PAT de GitLab con el alcance read_api. Se guarda cifrado y no se muestra nunca más."}
        </Styles.Hint>
      </Styles.FormField>

      <Styles.Button disabled={saving} type="submit">
        {saving ? "Guardando..." : "Guardar configuración"}
      </Styles.Button>
    </form>
  );
}

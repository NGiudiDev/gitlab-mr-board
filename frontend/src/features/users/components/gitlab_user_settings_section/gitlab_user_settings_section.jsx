import { useEffect, useState } from "react";

import { Styles } from "../../../../app/app.styles.jsx";

export function GitlabUserSettingsSection(props) {
  const { onSave = () => {}, submitting = false, user = null } = props;

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
      <Styles.SectionHeading id="identidad-heading">
        Usuario de GitLab
      </Styles.SectionHeading>

      <Styles.SectionDescription>
        Con tu nickname el tablero reconoce cuáles de los merge requests del equipo son tuyos.
      </Styles.SectionDescription>

      {error ? (
        <Styles.Alert role="alert">
          {error}
        </Styles.Alert>
      ) : null}

      {message ? (
        <Styles.Alert $success role="status">
          {message}
        </Styles.Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        <Styles.FormField>
          <Styles.Label htmlFor="identidad-nickname">
            Nickname de GitLab
          </Styles.Label>

          <Styles.Field
            aria-describedby="identidad-nickname-ayuda"
            autoCapitalize="none"
            id="identidad-nickname"
            onChange={(event) => setGitlabUsername(event.target.value)}
            required
            spellCheck="false"
            type="text"
            value={gitlabUsername}
          />

          <Styles.Hint id="identidad-nickname-ayuda">
            Tu nombre de usuario en GitLab, sin la arroba.
          </Styles.Hint>
        </Styles.FormField>

        <Styles.Button disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Guardar mi nickname"}
        </Styles.Button>
      </form>
    </section>
  );
}


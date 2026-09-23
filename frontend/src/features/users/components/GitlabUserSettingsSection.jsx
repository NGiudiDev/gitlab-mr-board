import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Field,
  FormField,
  Hint,
  Label,
  SectionDescription,
  SectionHeading,
} from "../../../app/constants/styles.consts.js";

/**
 * Nickname de GitLab de la propia persona.
 *
 * Es lo único de GitLab que carga cada uno: el token y los proyectos son de la
 * cuenta, pero con qué nombre aparece cada persona en los merge requests es
 * suyo, y de eso depende la vista personal.
 */
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
      <SectionHeading id="identidad-heading">
        Usuario de GitLab
      </SectionHeading>

      <SectionDescription>
        Con tu nickname el tablero reconoce cuáles de los merge requests del equipo son tuyos.
      </SectionDescription>

      {error ? (
        <Alert role="alert">
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert $success role="status">
          {message}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        {/* La ayuda queda fuera del `label` para que no forme parte del nombre
            accesible del campo; `aria-describedby` la asocia igual. */}
        <FormField>
          <Label htmlFor="identidad-nickname">
            Nickname de GitLab
          </Label>
          <Field
            aria-describedby="identidad-nickname-ayuda"
            autoCapitalize="none"
            id="identidad-nickname"
            onChange={(event) => setGitlabUsername(event.target.value)}
            required
            spellCheck="false"
            type="text"
            value={gitlabUsername}
          />
          <Hint id="identidad-nickname-ayuda">
            Tu nombre de usuario en GitLab, sin la arroba.
          </Hint>
        </FormField>

        <Button disabled={submitting} type="submit">
          {submitting ? "Guardando..." : "Guardar mi nickname"}
        </Button>
      </form>
    </section>
  );
}


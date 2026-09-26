import { useEffect, useState } from "react";

import { Styles } from "../../../app/app.styles.jsx";

export function ProfilePanel(props) {
  const {
    onSave = async () => null,
    submitting = false,
    user = null,
  } = props;

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
      <Styles.SectionHeading id="perfil-heading">
        Mi perfil
      </Styles.SectionHeading>

      <Styles.SectionDescription>
        Estos datos identifican tu sesión. Si cambiás el email, usá el nuevo la próxima vez que ingreses.
      </Styles.SectionDescription>

      <form onSubmit={handleSubmit}>
        <Styles.SpacedLabel htmlFor="perfil-email">
          Email
          <Styles.Field
            autoCapitalize="none"
            autoComplete="email"
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
        </Styles.SpacedLabel>

        <Styles.SpacedLabel htmlFor="perfil-display-name">
          Nombre visible
          <Styles.Field
            autoComplete="name"
            disabled={submitting}
            id="perfil-display-name"
            name="displayName"
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            type="text"
            value={profile.displayName}
          />
        </Styles.SpacedLabel>

        {error ? (
          <Styles.InlineFeedback role="alert">{error}</Styles.InlineFeedback>
        ) : null}

        {notice ? (
          <Styles.InlineFeedback $success role="status">{notice}</Styles.InlineFeedback>
        ) : null}

        <Styles.TopSpacedButton disabled={submitting} type="submit">
          {submitting ? "Guardando…" : "Guardar perfil"}
        </Styles.TopSpacedButton>
      </form>
    </section>
  );
}

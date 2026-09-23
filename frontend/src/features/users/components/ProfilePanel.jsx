import { useEffect, useState } from "react";

import {
  Field,
  InlineFeedback,
  SectionDescription,
  SectionHeading,
  SpacedLabel,
  TopSpacedButton,
} from "../../../app/constants/styles.consts.js";

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
      <SectionHeading id="perfil-heading">
        Mi perfil
      </SectionHeading>

      <SectionDescription>
        Estos datos identifican tu sesión. Si cambiás el email, usá el nuevo la próxima vez que ingreses.
      </SectionDescription>

      <form onSubmit={handleSubmit}>
        <SpacedLabel htmlFor="perfil-email">
          Email
          <Field
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
        </SpacedLabel>

        <SpacedLabel htmlFor="perfil-display-name">
          Nombre visible
          <Field
            autoComplete="name"
            disabled={submitting}
            id="perfil-display-name"
            name="displayName"
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            type="text"
            value={profile.displayName}
          />
        </SpacedLabel>

        {error ? (
          <InlineFeedback role="alert">{error}</InlineFeedback>
        ) : null}

        {notice ? (
          <InlineFeedback $success role="status">{notice}</InlineFeedback>
        ) : null}

        <TopSpacedButton disabled={submitting} type="submit">
          {submitting ? "Guardando…" : "Guardar perfil"}
        </TopSpacedButton>
      </form>
    </section>
  );
}

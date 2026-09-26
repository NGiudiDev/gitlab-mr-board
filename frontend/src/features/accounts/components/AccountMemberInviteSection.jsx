import { useState } from "react";
import styled from "styled-components";

import { Styles } from "../../../app/app.styles.jsx";

const InviteDescription = styled(Styles.SectionDescription)`
  margin-bottom: 0.75rem;
`;

const InviteField = styled(Styles.Field)`
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
`;

export function AccountMemberInviteSection(props) {
  const {
    inviteCode = "",
    onRotate = async () => null,
    submitting = false,
  } = props;

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleRotate() {
    setError(null);
    setMessage(null);

    try {
      const failure = await onRotate();

      if (failure) {
        setError(failure);
        return;
      }

      setMessage("Código de invitación renovado.");
    } catch {
      setError("No se pudo renovar el código de invitación.");
    }
  }

  return (
    <section aria-labelledby="invitacion-heading">
      <Styles.SectionHeading id="invitacion-heading">
        Invitar al equipo
      </Styles.SectionHeading>

      <InviteDescription>
        Quien se registre con este código entra a esta cuenta y ve el mismo tablero, sin cargar ninguna credencial de GitLab.
      </InviteDescription>

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

      <Styles.FormField>
        <Styles.Label htmlFor="cuenta-invitacion">
          Código de invitación
        </Styles.Label>

        <InviteField
          id="cuenta-invitacion"
          readOnly
          type="text"
          value={inviteCode}
        />
      </Styles.FormField>

      <Styles.SecondaryButton
        disabled={submitting}
        onClick={handleRotate}
        type="button"
      >
        {submitting ? "Renovando..." : "Renovar el código"}
      </Styles.SecondaryButton>

      <Styles.Hint>
        Al renovarlo, el código anterior deja de servir. Quien ya se sumó no pierde el acceso.
      </Styles.Hint>
    </section>
  );
}

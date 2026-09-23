import { useState } from "react";
import styled from "styled-components";

import {
  Alert,
  Field,
  FormField,
  Hint,
  Label,
  SecondaryButton,
  SectionDescription,
  SectionHeading,
} from "../../../app/constants/styles.consts.js";

const InviteDescription = styled(SectionDescription)`
  margin-bottom: 0.75rem;
`;

const InviteField = styled(Field)`
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
      <SectionHeading id="invitacion-heading">
        Invitar al equipo
      </SectionHeading>

      <InviteDescription>
        Quien se registre con este código entra a esta cuenta y ve el mismo tablero, sin cargar ninguna credencial de GitLab.
      </InviteDescription>

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

      <FormField>
        <Label htmlFor="cuenta-invitacion">
          Código de invitación
        </Label>

        <InviteField
          id="cuenta-invitacion"
          readOnly
          type="text"
          value={inviteCode}
        />
      </FormField>

      <SecondaryButton
        disabled={submitting}
        onClick={handleRotate}
        type="button"
      >
        {submitting ? "Renovando..." : "Renovar el código"}
      </SecondaryButton>

      <Hint>
        Al renovarlo, el código anterior deja de servir. Quien ya se sumó no pierde el acceso.
      </Hint>
    </section>
  );
}

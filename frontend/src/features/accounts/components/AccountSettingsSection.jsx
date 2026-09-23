import { useEffect, useState } from "react";
import styled from "styled-components";

import { renameAccount } from "../hooks/useAccount.js";

import {
  Alert,
  Button,
  DetailList,
  DetailValue,
  Field,
  FormField,
  Hint,
  Label,
  SectionDescription,
  SectionHeading,
} from "../../../app/constants/styles.consts.js";

const SpacedDetailValue = styled(DetailValue)`
  margin-bottom: 0.75rem;
`;

/** Describe la cantidad de integrantes con singular y plural correctos. */
function membersLabel(memberCount) {
  return memberCount === 1 ? "1 persona" : `${memberCount} personas`;
}

export function AccountSettingsSection(props) {
  const { account = null } = props;

  const [formError, setFormError] = useState(null);
  const [message, setMessage] = useState(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // La cuenta llega después del primer render, así que el campo se completa
  // recién cuando el backend responde.
  useEffect(() => {
    setName(account?.name ?? "");
  }, [account]);

  // El backend sólo devuelve el código de invitación a un administrador.
  const canEdit = Boolean(account?.inviteCode);

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const failure = await renameAccount(name);

      if (failure) {
        setFormError(failure);
        return;
      }

      setMessage("Nombre de la cuenta actualizado.");
    } catch {
      setFormError("No se pudo conectar al backend.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="cuenta-heading">
      <SectionHeading id="cuenta-heading">
        Mi cuenta
      </SectionHeading>

      <SectionDescription>
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
      </SectionDescription>

      {formError ? (
        <Alert role="alert">
          {formError}
        </Alert>
      ) : null}

      {message ? (
        <Alert $success role="status">
          {message}
        </Alert>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleSubmit}>
          <FormField>
            <Label htmlFor="cuenta-nombre">
              Nombre de la cuenta
            </Label>

            <Field
              aria-describedby="cuenta-nombre-ayuda"
              id="cuenta-nombre"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />

            <Hint id="cuenta-nombre-ayuda">
              La integran {membersLabel(account.memberCount)}.
            </Hint>
          </FormField>

          <Button disabled={submitting} type="submit">
            {submitting ? "Guardando..." : "Guardar el nombre"}
          </Button>
        </form>
      ) : (
        <DetailList>
          <Label as="dt">Cuenta</Label>
          <SpacedDetailValue>{account.name}</SpacedDetailValue>

          <Label as="dt">Integrantes</Label>
          <DetailValue>{membersLabel(account.memberCount)}</DetailValue>
        </DetailList>
      )}
    </section>
  );
}

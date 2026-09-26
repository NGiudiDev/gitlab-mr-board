import { useEffect, useState } from "react";
import styled from "styled-components";

import { Styles } from "../../../app/app.styles.jsx";

import { renameAccount } from "../hooks/useAccount.js";

const SpacedDetailValue = styled(Styles.DetailValue)`
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
      <Styles.SectionHeading id="cuenta-heading">
        Mi cuenta
      </Styles.SectionHeading>

      <Styles.SectionDescription>
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
      </Styles.SectionDescription>

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

      {canEdit ? (
        <form onSubmit={handleSubmit}>
          <Styles.FormField>
            <Styles.Label htmlFor="cuenta-nombre">
              Nombre de la cuenta
            </Styles.Label>

            <Styles.Field
              aria-describedby="cuenta-nombre-ayuda"
              id="cuenta-nombre"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />

            <Styles.Hint id="cuenta-nombre-ayuda">
              La integran {membersLabel(account.memberCount)}.
            </Styles.Hint>
          </Styles.FormField>

          <Styles.Button disabled={submitting} type="submit">
            {submitting ? "Guardando..." : "Guardar el nombre"}
          </Styles.Button>
        </form>
      ) : (
        <Styles.DetailList>
          <Styles.Label as="dt">Cuenta</Styles.Label>
          <SpacedDetailValue>{account.name}</SpacedDetailValue>

          <Styles.Label as="dt">Integrantes</Styles.Label>
          <Styles.DetailValue>{membersLabel(account.memberCount)}</Styles.DetailValue>
        </Styles.DetailList>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./account_settings_section.style.js";
import { renameAccount } from "../../hooks/useAccount.js";

//TODO: Sacar esta función a un utilitario general.
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
      <AppStyles.SectionHeading id="cuenta-heading">
        Mi cuenta
      </AppStyles.SectionHeading>

      <AppStyles.SectionDescription>
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
      </AppStyles.SectionDescription>

      {formError ? (
        <AppStyles.Alert role="alert">
          {formError}
        </AppStyles.Alert>
      ) : null}

      {message ? (
        <AppStyles.Alert $success role="status">
          {message}
        </AppStyles.Alert>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleSubmit}>
          <AppStyles.FormField>
            <AppStyles.Label htmlFor="cuenta-nombre">
              Nombre de la cuenta
            </AppStyles.Label>

            <AppStyles.Field
              aria-describedby="cuenta-nombre-ayuda"
              id="cuenta-nombre"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />

            <AppStyles.Hint id="cuenta-nombre-ayuda">
              La integran {membersLabel(account.memberCount)}.
            </AppStyles.Hint>
          </AppStyles.FormField>

          <AppStyles.Button disabled={submitting} type="submit">
            {submitting ? "Guardando..." : "Guardar el nombre"}
          </AppStyles.Button>
        </form>
      ) : (
        <AppStyles.DetailList>
          <AppStyles.Label as="dt">Cuenta</AppStyles.Label>
          <Styles.SpacedDetailValue>{account.name}</Styles.SpacedDetailValue>

          <AppStyles.Label as="dt">Integrantes</AppStyles.Label>
          <AppStyles.DetailValue>{membersLabel(account.memberCount)}</AppStyles.DetailValue>
        </AppStyles.DetailList>
      )}
    </section>
  );
}

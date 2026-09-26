import { useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./account_member_invite_section.style.js";

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
      <AppStyles.SectionHeading id="invitacion-heading">
        Invitar al equipo
      </AppStyles.SectionHeading>

      <Styles.InviteDescription>
        Quien se registre con este código entra a esta cuenta y ve el mismo tablero, sin cargar ninguna credencial de GitLab.
      </Styles.InviteDescription>

      {error ? (
        <AppStyles.Alert role="alert">
          {error}
        </AppStyles.Alert>
      ) : null}

      {message ? (
        <AppStyles.Alert $success role="status">
          {message}
        </AppStyles.Alert>
      ) : null}

      <AppStyles.FormField>
        <AppStyles.Label htmlFor="cuenta-invitacion">
          Código de invitación
        </AppStyles.Label>

        <Styles.InviteField
          id="cuenta-invitacion"
          readOnly
          type="text"
          value={inviteCode}
        />
      </AppStyles.FormField>

      <AppStyles.SecondaryButton
        disabled={submitting}
        onClick={handleRotate}
        type="button"
      >
        {submitting ? "Renovando..." : "Renovar el código"}
      </AppStyles.SecondaryButton>

      <AppStyles.Hint>
        Al renovarlo, el código anterior deja de servir. Quien ya se sumó no pierde el acceso.
      </AppStyles.Hint>
    </section>
  );
}

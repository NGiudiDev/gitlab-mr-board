import { useEffect, useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { renameAccount } from "../../hooks/useAccount.js";
import { formatMemberCount } from "../../utils/account.utils.js";

export function AccountNameForm(props) {
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
    <form onSubmit={handleSubmit}>
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
          La integran {formatMemberCount(account.memberCount)}.
        </AppStyles.Hint>
      </AppStyles.FormField>

      <AppStyles.Button disabled={submitting} type="submit">
        {submitting ? "Guardando..." : "Guardar el nombre"}
      </AppStyles.Button>
    </form>
  );
}

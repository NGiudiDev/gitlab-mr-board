import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { AccountDetails } from "../account_details/account_details.jsx";
import { AccountNameForm } from "../account_name_form/account_name_form.jsx";

export function AccountSettingsSection(props) {
  const { account = null } = props;

  // El backend sólo devuelve el código de invitación a un administrador.
  const canEdit = Boolean(account?.inviteCode);

  return (
    <section aria-labelledby="cuenta-heading">
      <AppStyles.SectionHeading id="cuenta-heading">
        Mi cuenta
      </AppStyles.SectionHeading>

      <AppStyles.SectionDescription>
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
      </AppStyles.SectionDescription>

      {canEdit
        ? <AccountNameForm account={account} />
        : <AccountDetails account={account} />}
    </section>
  );
}

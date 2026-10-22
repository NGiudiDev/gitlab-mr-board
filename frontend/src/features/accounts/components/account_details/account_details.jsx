import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./account_details.style.js";

import { formatMemberCount } from "../../utils/account.utils.js";

export function AccountDetails(props) {
  const { account = null } = props;

  return (
    <AppStyles.DetailList>
      <AppStyles.Label as="dt">Cuenta</AppStyles.Label>
      <Styles.SpacedDetailValue>{account.name}</Styles.SpacedDetailValue>

      <AppStyles.Label as="dt">Integrantes</AppStyles.Label>
      <AppStyles.DetailValue>{formatMemberCount(account.memberCount)}</AppStyles.DetailValue>
    </AppStyles.DetailList>
  );
}

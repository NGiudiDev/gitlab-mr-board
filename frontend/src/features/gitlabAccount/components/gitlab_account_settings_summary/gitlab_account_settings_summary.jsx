import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./gitlab_account_settings_summary.style.js";

export function GitlabAccountSettingsSummary(props) {
  const { settings = null } = props;

  if (!settings) {
    return (
      <AppStyles.LoadingText role="status">
        Todavía no hay proyectos ni access token cargados. Pedíselo a quien administra la cuenta.
      </AppStyles.LoadingText>
    );
  }

  return (
    <AppStyles.DetailList>
      <AppStyles.Label as="dt">Proyectos</AppStyles.Label>
      <Styles.ProjectIds>{settings.projectIds.join(", ")}</Styles.ProjectIds>

      <AppStyles.Label as="dt">Access token</AppStyles.Label>
      <AppStyles.DetailValue>
        Guardado, terminado en «{settings.tokenHint}».
      </AppStyles.DetailValue>
    </AppStyles.DetailList>
  );
}

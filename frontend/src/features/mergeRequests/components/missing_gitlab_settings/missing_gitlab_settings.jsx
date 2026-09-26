import { BoardStatus } from "../board_status/board_status.jsx";

import { Styles } from "./missing_gitlab_settings.style.js";

import { APP_PATHS } from "../../../../app/constants/routes.consts.js";

export function MissingGitlabSettings(props) {
  const { canConfigure = false } = props;

  return (
    <BoardStatus>
      <Styles.Message>
        {canConfigure
          ? "Todavía no configuraste GitLab en tu cuenta."
          : "Tu cuenta todavía no tiene datos de GitLab. Pedile a quien la administra que cargue los proyectos y el access token."}
      </Styles.Message>

      {canConfigure ? (
        <Styles.SettingsLink to={APP_PATHS.account}>
          Configurar en Mi cuenta
        </Styles.SettingsLink>
      ) : null}
    </BoardStatus>
  );
}

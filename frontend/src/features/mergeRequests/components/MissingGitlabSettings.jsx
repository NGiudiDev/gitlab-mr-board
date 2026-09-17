import { Link } from "react-router";

import { APP_PATHS } from "../../../app/constants/routes.consts.js";
import { PRIMARY_BUTTON_CLASSES } from "../../../app/constants/styles.consts.js";
import { BoardStatus } from "./BoardStatus.jsx";

/** Explica cómo completar la configuración de GitLab que necesita el tablero. */
function MissingGitlabSettings({ canConfigure = false }) {
  return (
    <BoardStatus>
      <p className="mb-3">
        {canConfigure
          ? "Todavía no configuraste GitLab en tu cuenta."
          : "Tu cuenta todavía no tiene datos de GitLab. Pedile a quien la administra que cargue los proyectos y el access token."}
      </p>
      {canConfigure ? (
        <Link
          className={PRIMARY_BUTTON_CLASSES}
          to={APP_PATHS.account}
        >
          Configurar en Mi cuenta
        </Link>
      ) : null}
    </BoardStatus>
  );
}

export { MissingGitlabSettings };

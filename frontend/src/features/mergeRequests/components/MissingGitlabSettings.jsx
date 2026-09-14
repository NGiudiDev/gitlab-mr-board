// 2. Dependencias externas.
import { Link } from "react-router";

// 6. Imports relativos restantes.
import { APP_PATHS } from "../../../app/routes.js";
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
          className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          to={APP_PATHS.account}
        >
          Configurar en Mi cuenta
        </Link>
      ) : null}
    </BoardStatus>
  );
}

export { MissingGitlabSettings };

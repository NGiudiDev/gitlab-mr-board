import { Link } from "react-router";
import styled from "styled-components";

import { Styles } from "../../../app/app.styles.jsx";
import { APP_PATHS } from "../../../app/constants/routes.consts.js";

import { BoardStatus } from "./BoardStatus.jsx";

const Message = styled.p`
  margin: 0 0 0.75rem;
`;

const SettingsLink = styled(Styles.Button).attrs({ as: Link })`
  display: inline-block;
  text-decoration: none;
`;

export function MissingGitlabSettings(props) {
  const { canConfigure = false } = props;

  return (
    <BoardStatus>
      <Message>
        {canConfigure
          ? "Todavía no configuraste GitLab en tu cuenta."
          : "Tu cuenta todavía no tiene datos de GitLab. Pedile a quien la administra que cargue los proyectos y el access token."}
      </Message>

      {canConfigure ? (
        <SettingsLink to={APP_PATHS.account}>
          Configurar en Mi cuenta
        </SettingsLink>
      ) : null}
    </BoardStatus>
  );
}

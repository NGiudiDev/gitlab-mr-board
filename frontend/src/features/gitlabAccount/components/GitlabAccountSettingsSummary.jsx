import styled from "styled-components";

import {
  DetailList,
  DetailValue,
  Label,
  LoadingText,
} from "../../../app/constants/styles.consts.js";

const ProjectIds = styled(DetailValue)`
  margin-bottom: 0.75rem;
  font-family: var(--font-mono);
`;

export function GitlabAccountSettingsSummary(props) {
  const { settings = null } = props;

  if (!settings) {
    return (
      <LoadingText role="status">
        Todavía no hay proyectos ni access token cargados. Pedíselo a quien administra la cuenta.
      </LoadingText>
    );
  }

  return (
    <DetailList>
      <Label as="dt">Proyectos</Label>
      <ProjectIds>{settings.projectIds.join(", ")}</ProjectIds>

      <Label as="dt">Access token</Label>
      <DetailValue>
        Guardado, terminado en «{settings.tokenHint}».
      </DetailValue>
    </DetailList>
  );
}

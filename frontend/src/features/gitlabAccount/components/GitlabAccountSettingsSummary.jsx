import styled from "styled-components";

import { Styles } from "../../../app/app.styles.jsx";

const ProjectIds = styled(Styles.DetailValue)`
  margin-bottom: 0.75rem;
  font-family: var(--font-mono);
`;

export function GitlabAccountSettingsSummary(props) {
  const { settings = null } = props;

  if (!settings) {
    return (
      <Styles.LoadingText role="status">
        Todavía no hay proyectos ni access token cargados. Pedíselo a quien administra la cuenta.
      </Styles.LoadingText>
    );
  }

  return (
    <Styles.DetailList>
      <Styles.Label as="dt">Proyectos</Styles.Label>
      <ProjectIds>{settings.projectIds.join(", ")}</ProjectIds>

      <Styles.Label as="dt">Access token</Styles.Label>
      <Styles.DetailValue>
        Guardado, terminado en «{settings.tokenHint}».
      </Styles.DetailValue>
    </Styles.DetailList>
  );
}

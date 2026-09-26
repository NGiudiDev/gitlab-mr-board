import styled from "styled-components";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

const InviteDescription = styled(AppStyles.SectionDescription)`
  margin-bottom: 0.75rem;
`;

const InviteField = styled(AppStyles.Field)`
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
`;

export const Styles = {
  InviteDescription,
  InviteField,
};

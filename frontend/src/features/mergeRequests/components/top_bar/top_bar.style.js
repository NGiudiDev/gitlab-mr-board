import styled from "styled-components";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

const Bar = styled.div`
  align-items: center;
  display: flex;
  gap: 0.625rem;
`;

const RefreshButton = styled(AppStyles.SecondaryButton)`
  background: var(--color-surface-raised);
  font-size: 0.8125rem;
  padding: 0.375rem 0.75rem;
`;

const Summary = styled.p`
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.78125rem;
  margin: 0;
`;

export const Styles = {
  Bar,
  RefreshButton,
  Summary,
};

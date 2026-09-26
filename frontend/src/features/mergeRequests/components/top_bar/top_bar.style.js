import styled from "styled-components";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const RefreshButton = styled(AppStyles.SecondaryButton)`
  padding: 0.375rem 0.75rem;
  background: var(--color-surface-raised);
  font-size: 0.8125rem;
`;

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.75rem;
`;

const StatusDot = styled.span`
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
`;

const Summary = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.78125rem;
`;

export const Styles = {
  Bar,
  RefreshButton,
  Status,
  StatusDot,
  Summary,
};

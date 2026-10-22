import styled from "styled-components";

const Status = styled.span`
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.75rem;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
`;

const StatusDot = styled.span`
  background: ${({ $color }) => $color};
  border-radius: 9999px;
  flex: none;
  height: 7px;
  width: 7px;
`;

export const Styles = {
  Status,
  StatusDot,
};

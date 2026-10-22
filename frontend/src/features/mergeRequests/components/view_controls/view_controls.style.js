import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Controls = styled.section`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Option = styled.button`
  background: ${({ $selected }) => $selected ? "var(--color-surface-raised)" : "transparent"};
  border: 0;
  border-radius: 0.25rem;
  color: ${({ $selected }) => $selected ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  padding: 0.25rem 0.75rem;

  &:hover {
    color: var(--color-text-primary);
  }

  ${focusRingStyles}
`;

const Options = styled.div`
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  display: inline-flex;
  gap: 0.125rem;
  padding: 0.125rem;
`;

const PersonLabel = styled.label`
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  font-size: 0.75rem;
  font-weight: 600;
  gap: 0.5rem;
`;

const PersonSelect = styled.select`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 400;
  min-width: 14rem;
  padding: 0.375rem 0.75rem;
  ${focusRingStyles}
`;

export const Styles = {
  Controls,
  Option,
  Options,
  PersonLabel,
  PersonSelect,
};

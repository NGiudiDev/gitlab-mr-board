import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Controls = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
`;

const Option = styled.button`
  padding: 0.25rem 0.75rem;
  border: 0;
  border-radius: 0.25rem;
  background: ${({ $selected }) => $selected ? "var(--color-surface-raised)" : "transparent"};
  color: ${({ $selected }) => $selected ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  font-size: 0.8125rem;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  cursor: pointer;

  &:hover {
    color: var(--color-text-primary);
  }

  ${focusRingStyles}
`;

const Options = styled.div`
  display: inline-flex;
  gap: 0.125rem;
  padding: 0.125rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
`;

const PersonLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const PersonSelect = styled.select`
  min-width: 14rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 400;
  ${focusRingStyles}
`;

export const Styles = {
  Controls,
  Option,
  Options,
  PersonLabel,
  PersonSelect,
};

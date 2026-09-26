import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const ChoiceFieldset = styled.fieldset`
  margin: 0 0 1rem;
  padding: 0;
  border: 0;
`;

const ChoiceLegend = styled.legend`
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const ChoiceGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ChoiceButton = styled.button`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $active }) => $active ? "var(--color-accent)" : "var(--color-control)"};
  border-radius: 0.375rem;
  background: ${({ $active }) => $active ? "var(--color-surface-raised)" : "transparent"};
  color: ${({ $active }) => $active ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  font-size: 0.78125rem;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  cursor: pointer;

  &:hover {
    color: var(--color-text-primary);
  }

  ${focusRingStyles}
`;

const RegisterHint = styled.p`
  margin: -0.5rem 0 0.75rem;
  color: var(--color-text-faint);
  font-size: 0.71875rem;
`;

export const Styles = {
  ChoiceButton,
  ChoiceFieldset,
  ChoiceGroup,
  ChoiceLegend,
  RegisterHint,
};

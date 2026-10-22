import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const ChoiceButton = styled.button`
  background: ${({ $active }) => $active ? "var(--color-surface-raised)" : "transparent"};
  border: 1px solid ${({ $active }) => $active ? "var(--color-accent)" : "var(--color-control)"};
  border-radius: 0.375rem;
  color: ${({ $active }) => $active ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  cursor: pointer;
  flex: 1;
  font-size: 0.78125rem;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  padding: 0.5rem 0.75rem;

  &:hover {
    color: var(--color-text-primary);
  }

  ${focusRingStyles}
`;

const ChoiceFieldset = styled.fieldset`
  border: 0;
  margin: 0 0 1rem;
  padding: 0;
`;

const ChoiceGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ChoiceLegend = styled.legend`
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

export const Styles = {
  ChoiceButton,
  ChoiceFieldset,
  ChoiceGroup,
  ChoiceLegend,
};

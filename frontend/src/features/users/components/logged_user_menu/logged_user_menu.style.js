import styled from "styled-components";

import { focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Chevron = styled.svg`
  color: var(--color-text-muted);
  height: 1rem;
  transform: ${({ $open }) => $open ? "rotate(180deg)" : "none"};
  transition: transform 150ms ease;
  width: 1rem;
`;

const MenuContainer = styled.div`
  margin-left: auto;
  position: relative;
`;

const MenuTrigger = styled.button`
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-control);
  border-radius: 999px;
  color: var(--color-text-primary);
  display: flex;
  gap: 0.375rem;
  min-height: 2.5rem;
  padding: 0.25rem 0.375rem;

  &:hover {
    background: var(--color-surface-raised);
    border-color: var(--color-accent);
  }

  ${focusRingStyles}
`;

export const Styles = {
  Chevron,
  MenuContainer,
  MenuTrigger,
};

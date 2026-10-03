import styled from "styled-components";

import { Styles as AppStyles } from "../../app.styles.jsx";
import { focusRingStyles } from "../../constants/styles.consts.js";

const Container = styled.div`
  margin-bottom: ${({ $spaced }) => $spaced ? "0.75rem" : 0};
`;

const Control = styled.div`
  position: relative;
  margin-top: 0.25rem;
`;

const Field = styled(AppStyles.Field)`
  margin-top: 0;
  padding-right: 3rem;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: grid;
  width: 2.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  place-items: center;

  &:hover {
    color: var(--color-text-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

const VisibilityIcon = styled.svg`
  width: 1.125rem;
  height: 1.125rem;
`;

export const Styles = {
  Container,
  Control,
  Field,
  ToggleButton,
  VisibilityIcon,
};

import styled from "styled-components";

import { Styles as AppStyles } from "../../app/app.styles.jsx";
import { focusRingStyles } from "../../app/constants/styles.consts.js";

const Container = styled.div`
  margin-bottom: ${({ $spaced }) => $spaced ? "0.75rem" : 0};
`;

const Control = styled.div`
  margin-top: 0.25rem;
  position: relative;
`;

const Field = styled(AppStyles.Field)`
  margin-top: 0;
  padding-right: 3rem;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: 0;
  bottom: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  display: grid;
  padding: 0;
  place-items: center;
  position: absolute;
  right: 0;
  top: 0;
  width: 2.75rem;

  &:hover {
    color: var(--color-text-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

export const Styles = {
  Container,
  Control,
  Field,
  ToggleButton,
};

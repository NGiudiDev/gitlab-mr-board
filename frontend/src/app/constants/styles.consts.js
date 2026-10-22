import { css } from "styled-components";

export const disabledControlStyles = css`
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const focusRingStyles = css`
  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`;

export const visuallyHiddenStyles = css`
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

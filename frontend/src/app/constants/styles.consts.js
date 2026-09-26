import { css } from "styled-components";

export const focusRingStyles = css`
  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`;

export const disabledControlStyles = css`
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const visuallyHiddenStyles = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

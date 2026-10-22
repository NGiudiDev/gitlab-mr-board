import styled from "styled-components";

import { disabledControlStyles, focusRingStyles } from "../../../../app/constants/styles.consts.js";

const Form = styled.form`
  margin-top: 1rem;
`;

const UploadDateInput = styled.input`
  background: var(--color-surface);
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  color-scheme: dark;
  font-size: 0.8125rem;
  margin-top: 0.375rem;
  padding: 0.5rem 0.625rem;
  width: 100%;

  ${disabledControlStyles}
  ${focusRingStyles}
`;

const UploadDateLabel = styled.label`
  color: var(--color-text-muted);
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
`;

const UploadDateStatus = styled.p`
  color: ${({ $error }) => $error ? "var(--color-conflict)" : "var(--color-text-muted)"};
  font-size: 0.6875rem;
  margin: 0.25rem 0 0;
  min-height: 1rem;
`;

export const Styles = {
  Form,
  UploadDateInput,
  UploadDateLabel,
  UploadDateStatus,
};

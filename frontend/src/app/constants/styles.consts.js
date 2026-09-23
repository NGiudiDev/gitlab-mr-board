import styled, { css } from "styled-components";

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

export const VisuallyHidden = styled.span`
  ${visuallyHiddenStyles}
`;

export const AuthForm = styled.form`
  width: 100%;
  max-width: 24rem;
  margin: 4rem auto 0;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
`;

export const AuthFormHeading = styled.h1`
  margin: 0 0 0.25rem;
  color: var(--color-text-primary);
  font-size: 1.125rem;
  font-weight: 600;
`;

export const AuthFormDescription = styled.p`
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.78125rem;
`;

export const Button = styled.button`
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 0.375rem;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  ${disabledControlStyles}
  ${focusRingStyles}
`;

export const AuthSubmitButton = styled(Button)`
  width: 100%;
  margin-top: 0.5rem;
`;

export const TopSpacedButton = styled(Button)`
  margin-top: 1rem;
`;

export const SecondaryButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.78125rem;
  cursor: pointer;

  &:hover {
    border-color: var(--color-accent);
  }

  ${disabledControlStyles}
  ${focusRingStyles}
`;

export const ButtonLink = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-accent);
  cursor: pointer;
  ${focusRingStyles}
`;

export const AuthFormSwitch = styled.p`
  margin: 1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78125rem;
  text-align: center;
`;

export const Alert = styled.p`
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $success }) => $success ? "var(--color-ready)" : "var(--color-conflict)"};
  border-radius: 0.375rem;
  background: ${({ $success }) => $success ? "var(--color-ready-soft)" : "var(--color-conflict-soft)"};
  color: var(--color-text-primary);
  font-size: 0.78125rem;
`;

export const InlineFeedback = styled.p`
  margin: 0.75rem 0 0;
  color: ${({ $success }) => $success ? "var(--color-ready)" : "var(--color-conflict)"};
  font-size: 0.75rem;
`;

export const Field = styled.input`
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
  font: inherit;
  font-size: 0.8125rem;

  &:disabled {
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

export const Label = styled.label`
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

export const FormField = styled.div`
  margin-bottom: 1rem;
`;

export const SpacedLabel = styled(Label)`
  margin-bottom: 0.75rem;
`;

export const Hint = styled.p`
  margin: 0.25rem 0 0;
  color: var(--color-text-faint);
  font-size: 0.75rem;
  font-weight: 400;
`;

export const LoadingText = styled.p`
  color: var(--color-text-muted);
  font-size: 0.8125rem;
`;

export const SectionHeading = styled.h2`
  margin: 0 0 0.25rem;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
`;

export const SectionDescription = styled.p`
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.78125rem;
`;

export const DetailList = styled.dl`
  font-size: 0.8125rem;
`;

export const DetailValue = styled.dd`
  margin: 0.25rem 0 0;
  color: var(--color-text-primary);
`;

export const PageSections = styled.div`
  max-width: 36rem;
  margin: 0 auto;

  > section {
    padding: 1.25rem 0;
    border-top: 1px solid var(--color-border-soft);
  }

  > section:first-child {
    padding-top: 0;
    border-top: 0;
  }

  > section:last-child {
    padding-bottom: 0;
  }
`;

export const StatusPanel = styled.div`
  padding: 4rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  text-align: center;
`;

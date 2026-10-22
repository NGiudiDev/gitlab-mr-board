import styled, { createGlobalStyle } from "styled-components";

import {
  disabledControlStyles,
  focusRingStyles,
  visuallyHiddenStyles,
} from "./constants/styles.consts.js";

export const GlobalStyles = createGlobalStyle`
  :root {
    --color-accent: #45b8c9;
    --color-bg: #12141a;
    --color-border: #2a2f3a;
    --color-border-soft: #22252d;
    --color-conflict: #f06a6f;
    --color-conflict-soft: #301617;
    --color-control: #667085;
    --color-draft: #d9a441;
    --color-draft-soft: #2b2213;
    --color-ready: #4fb477;
    --color-ready-soft: #16261d;
    --color-surface: #1a1d24;
    --color-surface-raised: #22262f;
    --color-text-faint: #858e9e;
    --color-text-muted: #9098a6;
    --color-text-primary: #e7e9ed;
    --font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, "Cascadia Code", monospace;
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    color-scheme: dark;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    background: var(--color-bg);
    min-height: 100%;
  }

  body {
    background: var(--color-bg);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
    margin: 0;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  button, input, select {
    font: inherit;
  }

  a {
    color: var(--color-accent);
    text-decoration: none;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }

  ::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-surface);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
`;

const Alert = styled.p`
  background: ${({ $success }) => $success ? "var(--color-ready-soft)" : "var(--color-conflict-soft)"};
  border: 1px solid ${({ $success }) => $success ? "var(--color-ready)" : "var(--color-conflict)"};
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  font-size: 0.78125rem;
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
`;

const AuthForm = styled.form`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  margin: 4rem auto 0;
  max-width: 24rem;
  padding: 1.5rem;
  width: 100%;
`;

const AuthFormDescription = styled.p`
  color: var(--color-text-muted);
  font-size: 0.78125rem;
  margin: 0 0 1.25rem;
`;

const AuthFormHeading = styled.h1`
  color: var(--color-text-primary);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
`;

const AuthFormSwitch = styled.p`
  color: var(--color-text-muted);
  font-size: 0.78125rem;
  margin: 1rem 0 0;
  text-align: center;
`;

const Button = styled.button`
  background: var(--color-accent);
  border: 0;
  border-radius: 0.375rem;
  color: var(--color-bg);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  ${disabledControlStyles}
  ${focusRingStyles}
`;

const AuthSubmitButton = styled(Button)`
  margin-top: 0.5rem;
  width: 100%;
`;

const ButtonLink = styled.button`
  background: none;
  border: 0;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
  ${focusRingStyles}
`;

const DetailList = styled.dl`
  font-size: 0.8125rem;
`;

const DialogActions = styled.div`
  display: flex;
  gap: 0.625rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
`;

const DetailValue = styled.dd`
  color: var(--color-text-primary);
  margin: 0.25rem 0 0;
`;

const Field = styled.input`
  background: var(--color-surface-raised);
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  display: block;
  font: inherit;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  width: 100%;

  &:disabled {
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

const FormField = styled.div`
  margin-bottom: 1rem;
`;

const Hint = styled.p`
  color: var(--color-text-faint);
  font-size: 0.75rem;
  font-weight: 400;
  margin: 0.25rem 0 0;
`;

const InlineFeedback = styled.p`
  color: ${({ $success }) => $success ? "var(--color-ready)" : "var(--color-conflict)"};
  font-size: 0.75rem;
  margin: 0.75rem 0 0;
`;

const Label = styled.label`
  color: var(--color-text-muted);
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
`;

const LoadingText = styled.p`
  color: var(--color-text-muted);
  font-size: 0.8125rem;
`;

const PageSections = styled.div`
  margin: 0 auto;
  max-width: 36rem;

  > section {
    border-top: 1px solid var(--color-border-soft);
    padding: 1.25rem 0;
  }

  > section:first-child {
    border-top: 0;
    padding-top: 0;
  }

  > section:last-child {
    padding-bottom: 0;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.78125rem;
  padding: 0.5rem 0.75rem;

  &:hover {
    border-color: var(--color-accent);
  }

  ${disabledControlStyles}
  ${focusRingStyles}
`;

const SectionDescription = styled.p`
  color: var(--color-text-muted);
  font-size: 0.78125rem;
  margin: 0 0 1rem;
`;

const SectionHeading = styled.h2`
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
`;

const SpacedLabel = styled(Label)`
  margin-bottom: 0.75rem;
`;

const StatusPanel = styled.div`
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  padding: 4rem 1rem;
  text-align: center;
`;

const TopSpacedButton = styled(Button)`
  margin-top: 1rem;
`;

const VisuallyHidden = styled.span`
  ${visuallyHiddenStyles}
`;

export const Styles = {
  Alert,
  AuthForm,
  AuthFormDescription,
  AuthFormHeading,
  AuthFormSwitch,
  AuthSubmitButton,
  Button,
  ButtonLink,
  DetailList,
  DetailValue,
  DialogActions,
  Field,
  FormField,
  Hint,
  InlineFeedback,
  Label,
  LoadingText,
  PageSections,
  SecondaryButton,
  SectionDescription,
  SectionHeading,
  SpacedLabel,
  StatusPanel,
  TopSpacedButton,
  VisuallyHidden,
};

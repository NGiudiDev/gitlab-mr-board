import styled, { createGlobalStyle } from "styled-components";

import {
  disabledControlStyles,
  focusRingStyles,
  visuallyHiddenStyles,
} from "./constants/styles.consts.js";

export const GlobalStyles = createGlobalStyle`
  :root {
    color-scheme: dark;
    --color-bg: #12141a;
    --color-surface: #1a1d24;
    --color-surface-raised: #22262f;
    --color-border: #2a2f3a;
    --color-border-soft: #22252d;
    --color-control: #667085;
    --color-accent: #45b8c9;
    --color-ready: #4fb477;
    --color-ready-soft: #16261d;
    --color-draft: #d9a441;
    --color-draft-soft: #2b2213;
    --color-conflict: #f06a6f;
    --color-conflict-soft: #301617;
    --color-text-primary: #e7e9ed;
    --color-text-muted: #9098a6;
    --color-text-faint: #858e9e;
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    --font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, "Cascadia Code", monospace;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    min-height: 100%;
    background: var(--color-bg);
  }

  body {
    min-height: 100vh;
    margin: 0;
    background: var(--color-bg);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
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
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-surface);
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: var(--color-border);
  }
`;

const Alert = styled.p`
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $success }) => $success ? "var(--color-ready)" : "var(--color-conflict)"};
  border-radius: 0.375rem;
  background: ${({ $success }) => $success ? "var(--color-ready-soft)" : "var(--color-conflict-soft)"};
  color: var(--color-text-primary);
  font-size: 0.78125rem;
`;

const AuthForm = styled.form`
  width: 100%;
  max-width: 24rem;
  margin: 4rem auto 0;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
`;

const AuthFormDescription = styled.p`
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.78125rem;
`;

const AuthFormHeading = styled.h1`
  margin: 0 0 0.25rem;
  color: var(--color-text-primary);
  font-size: 1.125rem;
  font-weight: 600;
`;

const AuthFormSwitch = styled.p`
  margin: 1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78125rem;
  text-align: center;
`;

const Button = styled.button`
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

const AuthSubmitButton = styled(Button)`
  width: 100%;
  margin-top: 0.5rem;
`;

const ButtonLink = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-accent);
  cursor: pointer;
  ${focusRingStyles}
`;

const DetailList = styled.dl`
  font-size: 0.8125rem;
`;

const DetailValue = styled.dd`
  margin: 0.25rem 0 0;
  color: var(--color-text-primary);
`;

const Field = styled.input`
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

const FormField = styled.div`
  margin-bottom: 1rem;
`;

const Hint = styled.p`
  margin: 0.25rem 0 0;
  color: var(--color-text-faint);
  font-size: 0.75rem;
  font-weight: 400;
`;

const InlineFeedback = styled.p`
  margin: 0.75rem 0 0;
  color: ${({ $success }) => $success ? "var(--color-ready)" : "var(--color-conflict)"};
  font-size: 0.75rem;
`;

const Label = styled.label`
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const LoadingText = styled.p`
  color: var(--color-text-muted);
  font-size: 0.8125rem;
`;

const PageSections = styled.div`
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

const SecondaryButton = styled.button`
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

const SectionDescription = styled.p`
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.78125rem;
`;

const SectionHeading = styled.h2`
  margin: 0 0 0.25rem;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
`;

const SpacedLabel = styled(Label)`
  margin-bottom: 0.75rem;
`;

const StatusPanel = styled.div`
  padding: 4rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
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

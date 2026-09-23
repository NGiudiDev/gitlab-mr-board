import { createGlobalStyle } from "styled-components";

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

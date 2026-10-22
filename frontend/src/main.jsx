import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./app/app.jsx";

import { GlobalStyles } from "./app/app.styles.jsx";

import { createSentryErrorReporting } from "./app/utils/error_reporting.utils.js";

const sentryErrorReporting = createSentryErrorReporting();

createRoot(document.getElementById("app"), sentryErrorReporting.initialize()).render(
  <StrictMode>
    <BrowserRouter>
      <GlobalStyles />
      <App />
    </BrowserRouter>
  </StrictMode>,
);

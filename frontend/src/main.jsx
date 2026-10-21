import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./app/app.jsx";

import { GlobalStyles } from "./app/app.styles.jsx";

import { errorReporting } from "./errorReporting.js";

createRoot(document.getElementById("app"), errorReporting.initialize()).render(
  <StrictMode>
    <BrowserRouter>
      <GlobalStyles />
      <App />
    </BrowserRouter>
  </StrictMode>,
);

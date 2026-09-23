import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./app/App.jsx";
import { GlobalStyles } from "./app/GlobalStyles.jsx";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <BrowserRouter>
      <GlobalStyles />
      <App />
    </BrowserRouter>
  </StrictMode>,
);

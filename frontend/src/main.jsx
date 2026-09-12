// Revisado: 12/09

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App.jsx";

import "./assets/main.css";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { useState } from "react";

import { Styles as AppStyles } from "../../app.styles.jsx";
import { Styles } from "./masked_field.style.js";

function VisibilityIcon({ visible }) {
  if (visible) {
    return (
      <Styles.VisibilityIcon
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path d="M3 3l18 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path
          d="M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.7 10.7 0 0112 4c5.5 0 9 5.4 9 8a9.8 9.8 0 01-2.1 3.6M6.6 6.6C4.3 8 3 10.4 3 12c0 2.6 3.5 8 9 8a10 10 0 004.1-.9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </Styles.VisibilityIcon>
    );
  }

  return (
    <Styles.VisibilityIcon
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M3 12c0-2.6 3.5-8 9-8s9 5.4 9 8-3.5 8-9 8-9-5.4-9-8z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </Styles.VisibilityIcon>
  );
}

export function MaskedField(props) {
  const {
    disabled = false,
    id,
    label,
    spaced = false,
    visibilityLabel = "contraseña",
    ...fieldProps
  } = props;

  const [visible, setVisible] = useState(false);
  const toggleLabel = `${visible ? "Ocultar" : "Mostrar"} ${visibilityLabel}`;

  return (
    <Styles.Container $spaced={spaced}>
      <AppStyles.Label htmlFor={id}>{label}</AppStyles.Label>
      <Styles.Control>
        <Styles.Field
          {...fieldProps}
          disabled={disabled}
          id={id}
          type={visible ? "text" : "password"}
        />
        <Styles.ToggleButton
          aria-controls={id}
          aria-label={toggleLabel}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          title={toggleLabel}
          type="button"
        >
          <VisibilityIcon visible={visible} />
        </Styles.ToggleButton>
      </Styles.Control>
    </Styles.Container>
  );
}

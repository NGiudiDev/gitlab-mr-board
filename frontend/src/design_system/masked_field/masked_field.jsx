import { useState } from "react";

import { Styles as AppStyles } from "../../app/app.styles.jsx";
import { VisibilityIcon } from "../visibility_icon/visibility_icon.jsx";

import { Styles } from "./masked_field.style.js";

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

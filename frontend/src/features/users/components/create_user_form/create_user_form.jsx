import { useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { MaskedField } from "../../../../design_system/masked_field/masked_field.jsx";

import { MINIMUM_PASSWORD_LENGTH } from "../../../auth/constants/auth.consts.js";

import { Styles } from "./create_user_form.style.js";

import { EMPTY_USER_FORM, USER_ROLE_OPTIONS } from "../../constants/user.consts.js";

/** Alta administrada de una persona dentro de la cuenta. */
export function CreateUserForm(props) {
  const { onCreate = async () => false, submitting = false } = props;

  const [form, setForm] = useState(EMPTY_USER_FORM);

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const created = await onCreate({
      ...form,
      displayName: form.displayName.trim(),
      email: form.email.trim(),
    });

    if (created) setForm(EMPTY_USER_FORM);
  }

  return (
    <Styles.CreateForm aria-labelledby="alta-heading" onSubmit={handleSubmit}>
      <Styles.FormHeading id="alta-heading">
        Dar de alta un usuario en el equipo
      </Styles.FormHeading>

      <Styles.FormGrid>
        <AppStyles.Label htmlFor="alta-email">
          Email
          <AppStyles.Field
            autoCapitalize="none"
            autoComplete="email"
            id="alta-email"
            maxLength={254}
            name="email"
            onChange={updateField("email")}
            required
            spellCheck="false"
            type="email"
            value={form.email}
          />
        </AppStyles.Label>

        <AppStyles.Label htmlFor="alta-nombre">
          Nombre visible (opcional)
          <AppStyles.Field
            id="alta-nombre"
            maxLength={80}
            onChange={updateField("displayName")}
            type="text"
            value={form.displayName}
          />
        </AppStyles.Label>

        <MaskedField
          autoComplete="new-password"
          id="alta-password"
          label="Contraseña inicial"
          minLength={MINIMUM_PASSWORD_LENGTH}
          onChange={updateField("password")}
          required
          value={form.password}
          visibilityLabel="contraseña inicial"
        />

        <AppStyles.Label htmlFor="alta-rol">
          Rol
          <AppStyles.Field
            as="select"
            id="alta-rol"
            onChange={updateField("role")}
            value={form.role}
          >
            {USER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppStyles.Field>
        </AppStyles.Label>
      </Styles.FormGrid>

      <Styles.CreateButton disabled={submitting} type="submit">
        {submitting ? "Creando..." : "Crear usuario"}
      </Styles.CreateButton>
    </Styles.CreateForm>
  );
}

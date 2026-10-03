import { useState } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MaskedField } from "./masked_field.jsx";

function ControlledMaskedField(props) {
  const [value, setValue] = useState("");

  return (
    <MaskedField
      id="test-password"
      label="Contraseña"
      onChange={(event) => setValue(event.target.value)}
      value={value}
      {...props}
    />
  );
}

describe("MaskedField", () => {
  it("muestra y vuelve a ocultar el valor sin modificarlo", async () => {
    render(<ControlledMaskedField />);

    const field = screen.getByLabelText("Contraseña");
    await userEvent.type(field, "contrasena-de-prueba");

    expect(field.getAttribute("type")).toBe("password");

    await userEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));

    expect(field.getAttribute("type")).toBe("text");
    expect(field.value).toBe("contrasena-de-prueba");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" }).getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));

    expect(field.getAttribute("type")).toBe("password");
  });

  it("usa el nombre indicado para identificar un secreto que no es una contraseña", () => {
    render(<ControlledMaskedField visibilityLabel="access token" />);

    expect(screen.getByRole("button", { name: "Mostrar access token" })).toBeDefined();
  });

  it("deshabilita también el control de visibilidad", () => {
    render(<ControlledMaskedField disabled />);

    expect(screen.getByRole("button", { name: "Mostrar contraseña" }).disabled).toBe(true);
  });
});

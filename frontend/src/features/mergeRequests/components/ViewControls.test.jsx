import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ViewControls } from "./ViewControls.jsx";

const PEOPLE = [
  { name: "Ana Pérez", username: "ana" },
  { name: "Beto Ruiz", username: "beto" },
];

describe("ViewControls", () => {
  it("expone las dos vistas como botones con estado accesible", () => {
    render(<ViewControls viewMode="general" />);

    expect(screen.getByRole("button", { name: "General" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Personal" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("notifica el cambio a la vista personal", () => {
    const onViewChange = vi.fn();
    render(<ViewControls onViewChange={onViewChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Personal" }));

    expect(onViewChange).toHaveBeenCalledWith("personal");
  });

  it("muestra un selector etiquetado con nombre y username", () => {
    render(<ViewControls canChoosePerson people={PEOPLE} viewMode="personal" />);

    const select = screen.getByRole("combobox", { name: "Persona" });
    expect(select.textContent).toContain("Ana Pérez (@ana)");
    expect(select.textContent).toContain("Beto Ruiz (@beto)");
  });

  it("notifica la persona seleccionada", () => {
    const onPersonChange = vi.fn();
    render(<ViewControls canChoosePerson onPersonChange={onPersonChange} people={PEOPLE} viewMode="personal" />);

    fireEvent.change(screen.getByRole("combobox", { name: "Persona" }), { target: { value: "beto" } });

    expect(onPersonChange).toHaveBeenCalledWith("beto");
  });

  it("no ofrece el selector a quien no puede elegir persona", () => {
    render(<ViewControls people={PEOPLE} viewMode="personal" />);

    expect(screen.queryByRole("combobox", { name: "Persona" })).toBeNull();
  });

  it("tampoco lo ofrece en la vista general a quien sí puede elegir", () => {
    render(<ViewControls canChoosePerson people={PEOPLE} viewMode="general" />);

    expect(screen.queryByRole("combobox", { name: "Persona" })).toBeNull();
  });

  it("conserva una selección que ya no aparece en los datos actuales", () => {
    render(
      <ViewControls
        canChoosePerson
        selectedPersonName="Ana Pérez"
        selectedUsername="ana"
        viewMode="personal"
      />,
    );

    const select = screen.getByRole("combobox", { name: "Persona" });
    expect(select.value).toBe("ana");
    expect(select.textContent).toContain("Ana Pérez (sin tareas actuales)");
  });
});

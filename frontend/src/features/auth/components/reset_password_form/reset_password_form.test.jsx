import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResetPasswordForm } from "./reset_password_form.jsx";

async function fillPasswords(confirmation = "contrasena-nueva") {
  await userEvent.type(screen.getByLabelText("Contraseña nueva"), "contrasena-nueva");
  await userEvent.type(screen.getByLabelText("Repetí la contraseña nueva"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
}

describe("ResetPasswordForm", () => {
  it("envía la contraseña cuando ambas entradas coinciden", async () => {
    const onSubmit = vi.fn();
    render(<ResetPasswordForm hasToken onSubmit={onSubmit} />);

    await fillPasswords();

    expect(onSubmit).toHaveBeenCalledWith({ newPassword: "contrasena-nueva" });
  });

  it("avisa y no envía cuando las contraseñas no coinciden", async () => {
    const onSubmit = vi.fn();
    render(<ResetPasswordForm hasToken onSubmit={onSubmit} />);

    await fillPasswords("otra-contrasena");

    expect(screen.getByRole("alert").textContent).toBe("Las contraseñas no coinciden.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("bloquea el formulario cuando falta el token", () => {
    render(<ResetPasswordForm />);

    expect(screen.getByRole("alert").textContent).toContain("inválido");
    expect(screen.getByRole("button", { name: "Guardar contraseña" }).disabled).toBe(true);
  });
});

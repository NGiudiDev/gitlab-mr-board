import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot_password_form.jsx";

describe("ForgotPasswordForm", () => {
  it("envía el email normalizado", async () => {
    const onSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Email"), "  ana@example.com  ");
    await userEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(onSubmit).toHaveBeenCalledWith({ email: "ana@example.com" });
  });

  it("presenta el resultado sin revelar si la cuenta existe", () => {
    const notice = "Si el email está registrado, vas a recibir un enlace.";
    render(<ForgotPasswordForm notice={notice} />);

    expect(screen.getByRole("status").textContent).toBe(notice);
  });

  it("permite volver al ingreso", async () => {
    const onShowLogin = vi.fn();
    render(<ForgotPasswordForm onShowLogin={onShowLogin} />);

    await userEvent.click(screen.getByRole("button", { name: "Volver al ingreso" }));

    expect(onShowLogin).toHaveBeenCalledTimes(1);
  });
});

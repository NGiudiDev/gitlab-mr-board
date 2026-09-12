// Revisado 12/09
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountMemberInviteSection } from "./AccountMemberInviteSection.jsx";

/** Activa la renovación y espera a que el componente procese la respuesta. */
async function rotateInviteCode() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Renovar el código" }));
    await Promise.resolve();
  });
}

describe("AccountMemberInviteSection", () => {
  it("muestra el código listo para copiar", () => {
    render(<AccountMemberInviteSection inviteCode="ABCD234XYZ" />);

    const inviteCodeField = screen.getByLabelText("Código de invitación");
    expect(inviteCodeField.value).toBe("ABCD234XYZ");
    expect(inviteCodeField.readOnly).toBe(true);
  });

  it("solicita renovar el código y confirma el resultado", async () => {
    const onRotate = vi.fn().mockResolvedValue(null);
    render(
      <AccountMemberInviteSection
        inviteCode="ABCD234XYZ"
        onRotate={onRotate}
      />,
    );

    await rotateInviteCode();

    expect(onRotate).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toBe("Código de invitación renovado.");
  });

  it("muestra el error devuelto al renovar", async () => {
    const onRotate = vi.fn().mockResolvedValue("No tenés permisos para renovar el código.");
    render(
      <AccountMemberInviteSection
        inviteCode="ABCD234XYZ"
        onRotate={onRotate}
      />,
    );

    await rotateInviteCode();

    expect(screen.getByRole("alert").textContent).toBe("No tenés permisos para renovar el código.");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("avisa cuando la renovación falla inesperadamente", async () => {
    const onRotate = vi.fn().mockRejectedValue(new Error("sin red"));
    render(
      <AccountMemberInviteSection
        inviteCode="ABCD234XYZ"
        onRotate={onRotate}
      />,
    );

    await rotateInviteCode();

    expect(screen.getByRole("alert").textContent).toBe("No se pudo renovar el código de invitación.");
  });

  it("bloquea la acción mientras se está renovando", () => {
    render(<AccountMemberInviteSection inviteCode="ABCD234XYZ" submitting />);

    const button = screen.getByRole("button", { name: "Renovando..." });
    expect(button.disabled).toBe(true);
  });
});

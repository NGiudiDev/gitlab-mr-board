// Revisado 12/09
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, resetSharedState, TEST_ACCOUNT } from "../../../../test/sharedState.js";
import { AccountSettingsSection } from "./AccountSettingsSection.jsx";

const ADMIN_ACCOUNT = { ...TEST_ACCOUNT, inviteCode: "ABCD234XYZ" };

let fetchMock;

/** Deja que se resuelvan las promesas pendientes y React vuelva a renderizar. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Monta la sección con la cuenta indicada. */
function renderSection(account = ADMIN_ACCOUNT) {
  return render(<AccountSettingsSection account={account} />).container;
}

beforeEach(() => {
  resetSharedState();
  fetchMock = vi.fn(async () => jsonResponse({ account: ADMIN_ACCOUNT }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  resetSharedState();
  vi.unstubAllGlobals();
});

describe("presentación de la cuenta", () => {
  it("presenta el nombre y cuántas personas la integran", () => {
    const container = renderSection();

    expect(screen.getByLabelText("Nombre de la cuenta").value).toBe("Equipo de prueba");
    expect(container.textContent).toContain("3 personas");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("cambio de nombre", () => {
  it("envía el nombre nuevo y confirma el guardado", async () => {
    renderSection();
    fetchMock.mockResolvedValue(jsonResponse({ account: { ...ADMIN_ACCOUNT, name: "Plataforma" } }));

    fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), { target: { value: "Plataforma" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar el nombre/ }));
    await flush();

    const [, options] = fetchMock.mock.calls.at(-1);
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ name: "Plataforma" });
    expect(screen.getByRole("status").textContent).toBe("Nombre de la cuenta actualizado.");
  });

  it("muestra el error de validación del backend", async () => {
    renderSection();
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "El nombre es demasiado largo." }, 400));

    fireEvent.click(screen.getByRole("button", { name: /Guardar el nombre/ }));
    await flush();

    expect(screen.getByRole("alert").textContent).toBe("El nombre es demasiado largo.");
  });

  it("avisa cuando no se pudo conectar al backend", async () => {
    renderSection();
    fetchMock.mockRejectedValueOnce(new Error("sin red"));

    fireEvent.click(screen.getByRole("button", { name: /Guardar el nombre/ }));
    await flush();

    expect(screen.getByRole("alert").textContent).toBe("No se pudo conectar al backend.");
  });
});

describe("vista de quien no administra", () => {
  it("describe la cuenta sin ofrecer cambiarla", async () => {
    const container = renderSection(TEST_ACCOUNT);

    expect(container.textContent).toContain("Equipo de prueba");
    expect(container.textContent).toContain("3 personas");
    expect(screen.queryByLabelText("Nombre de la cuenta")).toBeNull();
  });
});

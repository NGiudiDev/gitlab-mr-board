// 2. Dependencias externas.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 6. Imports relativos restantes.
import { jsonResponse, resetSharedState, TEST_ACCOUNT, TEST_USER } from "../../test/sharedState.js";
import { AccountMenu, initialsFor } from "./AccountMenu.jsx";
import { APP_PATHS } from "./routes.js";

const ADMIN_USER = { ...TEST_USER, role: "admin" };

beforeEach(() => {
  resetSharedState();
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ account: TEST_ACCOUNT })));
});

afterEach(() => {
  resetSharedState();
  vi.unstubAllGlobals();
});

function LocationProbe() {
  const { pathname } = useLocation();

  return <output data-testid="current-path">{pathname}</output>;
}

function renderMenu(props = {}) {
  return render(
    <MemoryRouter>
      <AccountMenu {...props} />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("AccountMenu", () => {
  it("resume la sesión en un avatar y revela los datos al abrirlo", async () => {
    renderMenu({ user: TEST_USER });

    const trigger = screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" });
    expect(trigger.textContent).toContain("AP");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region", { name: "Menú de cuenta" })).toBeNull();

    await userEvent.click(trigger);

    const menu = screen.getByRole("region", { name: "Menú de cuenta" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-label")).toBe("Cerrar menú de cuenta de Ana Pérez");
    expect(menu.textContent).toContain("Ana Pérez");
    expect(menu.textContent).toContain("ana@example.com");
    await waitFor(() => expect(menu.textContent).toContain("Equipo de prueba"));
  });

  it("cierra el menú con Escape y devuelve el foco al avatar", async () => {
    const user = userEvent.setup();
    renderMenu({ user: TEST_USER });

    const trigger = screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" });
    await user.click(trigger);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Editar perfil" }));

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("region", { name: "Menú de cuenta" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("cierra el menú al interactuar fuera", async () => {
    renderMenu({ user: TEST_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("region", { name: "Menú de cuenta" })).toBeNull();
  });

  it("avisa al padre al cerrar sesión", async () => {
    const onLogout = vi.fn();
    renderMenu({ onLogout, user: TEST_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("abre la pantalla del perfil y cierra el menú", async () => {
    renderMenu({ user: TEST_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    await userEvent.click(screen.getByRole("link", { name: "Editar perfil" }));

    expect(screen.getByTestId("current-path").textContent).toBe(APP_PATHS.profile);
    expect(screen.queryByRole("region", { name: "Menú de cuenta" })).toBeNull();
  });

  it("ofrece editar la cuenta a un admin y navega a ella", async () => {
    renderMenu({ user: ADMIN_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    await userEvent.click(screen.getByRole("link", { name: "Editar cuenta" }));

    expect(screen.getByTestId("current-path").textContent).toBe(APP_PATHS.account);
    expect(screen.queryByRole("region", { name: "Menú de cuenta" })).toBeNull();
  });

  it("ofrece ver la cuenta cuando sus datos son de sólo lectura", async () => {
    renderMenu({ user: TEST_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));

    expect(screen.getByRole("link", { name: "Ver cuenta" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Editar cuenta" })).toBeNull();
  });

  it("no muestra nada sin usuario", () => {
    renderMenu();

    expect(screen.queryByRole("button", { name: /menú de cuenta/ })).toBeNull();
  });
});

describe("initialsFor", () => {
  it("usa el primer y el último nombre", () => {
    expect(initialsFor({ displayName: "Ana María Pérez", email: "ana@example.com" })).toBe("AP");
  });

  it("usa el email cuando falta el nombre visible", () => {
    expect(initialsFor({ email: "ana@example.com" })).toBe("AN");
  });
});

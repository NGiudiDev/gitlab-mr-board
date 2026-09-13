// 2. Dependencias externas.
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 6. Imports relativos restantes.
import { jsonResponse, resetSharedState, TEST_ACCOUNT, TEST_USER } from "../../test/sharedState.js";
import { AppShell } from "./AppShell.jsx";
import { APP_PATHS, sectionsFor } from "./routes.js";

const ADMIN_USER = { ...TEST_USER, role: "admin" };

beforeEach(() => {
  resetSharedState();
  // La barra pide la cuenta para mostrar de qué equipo es el tablero.
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

function renderShell(props = {}, path = APP_PATHS.board) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell {...props}><p>Contenido de la sección</p></AppShell>
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** Etiquetas de la barra de navegación, en el orden en que aparecen. */
function navLabels() {
  return screen.getAllByRole("link")
    .filter((link) => link.closest("nav"))
    .map((link) => link.textContent);
}

describe("AppShell", () => {
  it("presenta el contenido dentro de un único main accesible", () => {
    const { container } = renderShell({ user: TEST_USER });

    const main = container.querySelector("main");
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(main.id).toBe("contenido-principal");
    expect(main.textContent).toContain("Contenido de la sección");
  });

  it("ofrece el enlace para saltar al contenido principal", () => {
    const { container } = renderShell({ user: TEST_USER });

    expect(container.querySelector("a[href=\"#contenido-principal\"]").textContent)
      .toContain("Saltar al contenido principal");
  });

  it("usa el nombre del tablero como encabezado principal", () => {
    renderShell({ user: TEST_USER });

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Tablero de MRs");
  });

  it("muestra de qué equipo es el tablero que se está mirando", async () => {
    renderShell({ user: TEST_USER });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));

    expect(screen.getByRole("region", { name: "Menú de cuenta" }).textContent).toContain("Equipo de prueba");
  });

  it("esconde la barra sin sesión, para que el ingreso ocupe la pantalla", () => {
    renderShell();

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
  });
});

describe("AppShell: navegación", () => {
  it("ofrece sólo el tablero como navegación principal a cualquier usuario", () => {
    renderShell({ user: TEST_USER });

    expect(navLabels()).toEqual(["Tablero"]);
  });

  it("agrega la sección de usuarios a un admin", () => {
    renderShell({ user: ADMIN_USER });

    expect(navLabels()).toEqual(["Tablero", "Usuarios"]);
  });

  it("no marca el tablero cuando la cuenta está activa desde el menú", () => {
    renderShell({ user: TEST_USER }, APP_PATHS.account);

    expect(screen.queryByRole("link", { name: "Mi cuenta" })).toBeNull();
    expect(screen.getByRole("link", { name: "Tablero" }).getAttribute("aria-current")).toBeNull();
  });

  it("navega a la sección elegida", async () => {
    renderShell({ user: ADMIN_USER });

    await userEvent.click(screen.getByRole("link", { name: "Usuarios" }));

    expect(screen.getByTestId("current-path").textContent).toBe(APP_PATHS.users);
  });

  it("vuelve al tablero desde la cuenta", async () => {
    renderShell({ user: TEST_USER }, APP_PATHS.account);

    await userEvent.click(screen.getByRole("link", { name: "Tablero" }));

    expect(screen.getByTestId("current-path").textContent).toBe(APP_PATHS.board);
  });

  it("abre la pantalla personal desde la acción Editar perfil", async () => {
    renderShell({ user: TEST_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    await userEvent.click(screen.getByRole("link", { name: "Editar perfil" }));

    expect(screen.getByTestId("current-path").textContent).toBe(APP_PATHS.profile);
  });

  it("abre la pantalla compartida desde la acción Editar cuenta", async () => {
    renderShell({ user: ADMIN_USER });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    await userEvent.click(screen.getByRole("link", { name: "Editar cuenta" }));

    expect(screen.getByTestId("current-path").textContent).toBe(APP_PATHS.account);
  });

  it("avisa al padre al cerrar la sesión", async () => {
    const onLogout = vi.fn();
    renderShell({ user: TEST_USER, onLogout });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta de Ana Pérez" }));
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe("sectionsFor", () => {
  it("deja la administración de usuarios sólo para el rol admin", () => {
    expect(sectionsFor(TEST_USER).map((section) => section.id)).toEqual(["board", "profile", "account"]);
    expect(sectionsFor(ADMIN_USER).map((section) => section.id)).toEqual(["board", "profile", "account", "users"]);
  });

  it("sin usuario no ofrece ninguna sección de administración", () => {
    expect(sectionsFor(null).some((section) => section.id === "users")).toBe(false);
  });
});

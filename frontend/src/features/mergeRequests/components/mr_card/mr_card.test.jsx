import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MrCard } from "./mr_card.jsx";

import { buildMergeRequest } from "../../../../../test/fixtures/mergeRequests.js";

function renderCard(overrides = {}) {
  return render(<MrCard mr={buildMergeRequest(overrides)} />);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-28T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MrCard", () => {
  it("muestra el título sin enlazarlo a GitLab", () => {
    renderCard({ title: "Agregar filtro por autor" });

    expect(screen.getByRole("heading", { name: "Agregar filtro por autor" })).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Agregar filtro por autor/ })).toBeNull();
  });

  it("muestra la rama de origen y la de destino", () => {
    const { container } = renderCard({ sourceBranch: "fix/approvals", targetBranch: "develop" });

    expect(container.textContent).toContain("fix/approvals");
    expect(container.textContent).toContain("develop");
  });

  it("muestra el autor", () => {
    const { container } = renderCard({ author: "Ana Pérez" });

    expect(container.textContent).toContain("Ana Pérez");
  });

  it("renderiza los cuatro indicadores de bloqueo", () => {
    const { container } = renderCard();

    expect(container.textContent).toContain("CI OK");
    expect(container.textContent).toContain("Hilos OK");
    expect(container.textContent).toContain("2/2");
    expect(container.textContent).toContain("Sin conflictos");
  });

  // La regla que decide quién es responsable vive en el backend y sus test viven en
  // `mergeRequestRules.test.ts`; acá sólo se verifica cómo se presenta.
  it("muestra a los responsables informados por el backend", () => {
    const { container } = renderCard({
      responsiblePeople: [
        { name: "Beto Ruiz", username: "beto" },
        { name: "Caro Díaz", username: "caro" },
      ],
    });

    expect(container.textContent).toContain("Responsable:");
    expect(container.textContent).toContain("Beto Ruiz, Caro Díaz");
  });

  it("omite el responsable cuando el backend no informa ninguno", () => {
    const { container } = renderCard({ mergeability: "backlog", responsiblePeople: [] });

    expect(container.textContent).not.toContain("Responsable:");
  });

  it.each([
    ["2026-08-28T11:30:00.000Z", "30m"],
    ["2026-08-28T09:00:00.000Z", "3h"],
    ["2026-08-25T12:00:00.000Z", "3d"],
  ])("muestra la antigüedad de %s como %s", (updatedAt, expected) => {
    const { container } = renderCard({ updatedAt });

    expect(container.textContent).toContain(expected);
  });

  it("muestra al menos un minuto para una actualización reciente", () => {
    const { container } = renderCard({ updatedAt: "2026-08-28T11:59:59.000Z" });

    expect(container.textContent).toContain("1m");
  });

  it("expone la tarjeta como artículo", () => {
    renderCard({ title: "Agregar filtro por autor" });

    expect(screen.getByRole("article")).not.toBeNull();
  });

  it("mantiene la fecha fuera de la tarjeta", () => {
    renderCard({ uploadDate: "2026-10-10" });

    expect(screen.queryByLabelText("Fecha de subida")).toBeNull();
  });

  it("abre el detalle al activar la superficie de la tarjeta", () => {
    renderCard({ title: "Agregar filtro por autor" });

    fireEvent.click(screen.getByRole("button", { name: "Ver detalles de Agregar filtro por autor" }));

    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(screen.getByLabelText("Fecha de subida")).not.toBeNull();
  });

  it("cierra el detalle con Escape y devuelve el foco a la tarjeta", async () => {
    renderCard({ title: "Agregar filtro por autor" });
    const openButton = screen.getByRole("button", { name: "Ver detalles de Agregar filtro por autor" });
    openButton.focus();
    fireEvent.click(openButton);

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(openButton);
  });
});

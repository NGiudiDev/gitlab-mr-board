import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MrDetailModal } from "./mr_detail_modal.jsx";

import { buildMergeRequest } from "../../../../../test/fixtures/mergeRequests.js";

function renderModal(overrides = {}, props = {}) {
  return render(
    <MrDetailModal
      mr={buildMergeRequest(overrides)}
      onClose={props.onClose}
      onUploadDateChange={props.onUploadDateChange}
    />,
  );
}

describe("MrDetailModal", () => {
  it("replica la información de la tarjeta y agrega el detalle del MR", () => {
    renderModal({
      iid: 7,
      title: "Agregar filtro por autor",
      projectPath: "organización/equipo/tablero",
      sourceBranch: "feature/filtro",
      targetBranch: "main",
      responsiblePeople: [{ name: "Beto Ruiz", username: "beto" }],
    });
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByRole("heading").textContent).toBe("Agregar filtro por autor");
    expect(dialog.textContent).toContain("feature/filtro → main");
    expect(dialog.textContent).toContain("CI OK");
    expect(dialog.textContent).toContain("Hilos OK");
    expect(dialog.textContent).toContain("2/2");
    expect(dialog.textContent).toContain("Sin conflictos");
    expect(dialog.textContent).toContain("Ana Pérez");
    expect(dialog.textContent).toContain("Beto Ruiz");
    expect(dialog.textContent).toContain("tablero");
    expect(dialog.textContent).not.toContain("organización/equipo/tablero");
    expect(dialog.textContent).toContain("!7");
  });

  it("conserva el enlace a GitLab en una pestaña nueva", () => {
    renderModal();

    const link = screen.getByRole("link", { name: /Abrir merge request en GitLab/ });
    expect(link.getAttribute("href"))
      .toBe("https://gitlab.example.com/equipo/tablero/-/merge_requests/1");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  });

  it("espera al botón Guardar para actualizar la fecha", async () => {
    const onClose = vi.fn();
    const onUploadDateChange = vi.fn().mockResolvedValue(undefined);
    renderModal(
      { iid: 7, uploadDate: "2026-10-10" },
      { onClose, onUploadDateChange },
    );
    const field = screen.getByLabelText("Fecha de subida");

    fireEvent.change(field, { target: { value: "2026-10-15" } });
    expect(onUploadDateChange).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    });

    expect(onUploadDateChange).toHaveBeenCalledWith(101, 7, "2026-10-15");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("permite quitar la fecha antes de guardar", async () => {
    const onUploadDateChange = vi.fn().mockResolvedValue(undefined);
    renderModal({ uploadDate: "2026-10-10" }, { onUploadDateChange });

    fireEvent.change(screen.getByLabelText("Fecha de subida"), { target: { value: "" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    });

    expect(onUploadDateChange).toHaveBeenCalledWith(101, 1, "");
  });

  it("mantiene el modal abierto e informa si el guardado falla", async () => {
    const onClose = vi.fn();
    const onUploadDateChange = vi.fn().mockRejectedValue(new Error("No se pudo guardar."));
    renderModal(
      { uploadDate: "2026-10-10" },
      { onClose, onUploadDateChange },
    );

    fireEvent.change(screen.getByLabelText("Fecha de subida"), {
      target: { value: "2026-10-15" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("No se pudo guardar.");
    expect(screen.getByLabelText("Fecha de subida").value).toBe("2026-10-15");
  });

  it("no ofrece una fecha cuando el MR no está listo para mergear", () => {
    renderModal({ mergeability: "review" });

    expect(screen.queryByLabelText("Fecha de subida")).toBeNull();
    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Cerrar" })).not.toBeNull();
  });

  it("mantiene el foco dentro del diálogo", () => {
    renderModal();
    const closeButton = screen.getByRole("button", { name: "Cerrar detalle del merge request" });
    const saveButton = screen.getByRole("button", { name: "Guardar" });

    saveButton.focus();
    fireEvent.keyDown(saveButton, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(saveButton);
  });
});

import { describe, expect, it, vi } from "vitest";

import { createErrorReporting } from "./errorReporting.js";

function createSdk() {
  return {
    init: vi.fn(),
    reactErrorHandler: vi.fn((callback) => callback),
  };
}

describe("reportes de errores del frontend", () => {
  it("queda deshabilitado cuando no hay DSN", () => {
    const sdk = createSdk();
    const errorReporting = createErrorReporting({ environment: "test" }, sdk);

    expect(errorReporting.initialize()).toBeUndefined();
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.reactErrorHandler).not.toHaveBeenCalled();
  });

  it("inicia una sola vez y conecta los errores de React", () => {
    const sdk = createSdk();
    const errorReporting = createErrorReporting({
      dsn: "https://clave@example.ingest.sentry.io/1",
      environment: "production",
      release: "gitlab-mr-board@abc123",
    }, sdk);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const rootOptions = errorReporting.initialize();
    errorReporting.initialize();
    const error = new Error("fallo");
    rootOptions.onUncaughtError(error, { componentStack: "en App" });

    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sdk.init).toHaveBeenCalledWith({
      beforeSend: expect.any(Function),
      dsn: "https://clave@example.ingest.sentry.io/1",
      environment: "production",
      maxBreadcrumbs: 0,
      release: "gitlab-mr-board@abc123",
      sendDefaultPii: false,
    });
    const { beforeSend } = sdk.init.mock.calls[0][0];
    expect(beforeSend({
      message: "fallo",
      request: { url: "https://app.example.com/reset-password?token=secreto" },
      user: { email: "persona@example.com" },
    })).toEqual({ message: "fallo" });
    expect(rootOptions).toEqual({
      onCaughtError: expect.any(Function),
      onRecoverableError: expect.any(Function),
      onUncaughtError: expect.any(Function),
    });
    expect(consoleError).toHaveBeenCalledWith("Error no controlado en React:", error, "en App");

    consoleError.mockRestore();
  });

  it("continúa sin reportes si falla el SDK", () => {
    const sdk = createSdk();
    const error = new Error("DSN inválido");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    sdk.init.mockImplementation(() => {
      throw error;
    });
    const errorReporting = createErrorReporting({
      dsn: "https://invalido",
      environment: "test",
    }, sdk);

    expect(errorReporting.initialize()).toBeUndefined();
    expect(errorReporting.initialize()).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith("No se pudo iniciar Sentry en el frontend:", error);
    expect(sdk.init).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});

import { describe, expect, it, vi } from "vitest";

import { createErrorReporter } from "./errorReporting.js";

function createSdk() {
  const scope = { setContext: vi.fn() };
  const unsubscribe = vi.fn();
  const client = { on: vi.fn(() => unsubscribe) };

  return {
    captureException: vi.fn(() => "event-id"),
    close: vi.fn(() => Promise.resolve(true)),
    client,
    getClient: vi.fn(() => client),
    init: vi.fn(),
    scope,
    unsubscribe,
    withScope: vi.fn((callback) => callback(scope)),
  };
}

describe("reportes de errores del backend", () => {
  it("queda deshabilitado cuando no hay DSN", async () => {
    const sdk = createSdk();
    const reporter = createErrorReporter({ environment: "test" }, sdk);

    expect(reporter.initialize()).toBe(false);
    expect(reporter.captureException(new Error("fallo"))).toBeUndefined();
    await expect(reporter.close()).resolves.toBe(true);
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it("inicia una sola vez y captura contexto seguro", async () => {
    const sdk = createSdk();
    const reporter = createErrorReporter({
      dsn: "https://clave@example.ingest.sentry.io/1",
      environment: "production",
      release: "gitlab-mr-board@abc123",
    }, sdk);
    const error = new Error("fallo");

    expect(reporter.initialize()).toBe(true);
    expect(reporter.initialize()).toBe(true);
    expect(reporter.captureException(error, { method: "GET", path: "/api/error" })).toBe("event-id");
    await reporter.close(500);

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
      request: { cookies: { session: "secreto" } },
      user: { email: "persona@example.com" },
    })).toEqual({ message: "fallo" });
    expect(sdk.scope.setContext).toHaveBeenCalledWith("contexto", {
      method: "GET",
      path: "/api/error",
    });
    expect(sdk.captureException).toHaveBeenCalledWith(error);
    expect(sdk.close).toHaveBeenCalledWith(500);
  });

  it("permite observar la respuesta del transporte", () => {
    const sdk = createSdk();
    const reporter = createErrorReporter({
      dsn: "https://clave@example.ingest.sentry.io/1",
      environment: "test",
    }, sdk);
    const callback = vi.fn();

    reporter.initialize();
    const unsubscribe = reporter.subscribeToSentEvents(callback);

    expect(sdk.client.on).toHaveBeenCalledWith("afterSendEvent", callback);
    expect(unsubscribe).toBe(sdk.unsubscribe);
  });

  it("no interrumpe el arranque si falla el SDK", () => {
    const sdk = createSdk();
    const error = new Error("DSN inválido");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    sdk.init.mockImplementation(() => {
      throw error;
    });
    const reporter = createErrorReporter({
      dsn: "https://invalido",
      environment: "test",
    }, sdk);

    expect(reporter.initialize()).toBe(false);
    expect(reporter.initialize()).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("No se pudo iniciar Sentry en el backend:", error);
    expect(sdk.init).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});

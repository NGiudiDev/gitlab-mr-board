import * as Sentry from "@sentry/react";

import { config } from "./config.js";

/** Elimina del evento los campos que pueden contener datos de una persona. */
function removeSensitiveEventData(event) {
  const sanitizedEvent = { ...event };

  delete sanitizedEvent.request;
  delete sanitizedEvent.user;

  return sanitizedEvent;
}

/**
 * Construye el adaptador que conecta Sentry con los errores globales de React
 * sin acoplar el punto de entrada al SDK.
 *
 * @param options Configuración pública de Sentry.
 * @param sdk SDK compatible con `@sentry/react`.
 * @returns Adaptador que inicia Sentry y entrega opciones para `createRoot`.
 */
function createErrorReporting(options, sdk = Sentry) {
  const { dsn, environment, release } = options;
  let initializationAttempted = false;
  let initialized = false;

  /** Registra el error en la consola además de enviarlo a Sentry. */
  function createReactErrorHandler(message) {
    return sdk.reactErrorHandler((error, errorInfo) => {
      console.error(message, error, errorInfo.componentStack);
    });
  }

  function initialize() {
    if (!dsn) return undefined;

    if (!initializationAttempted) {
      initializationAttempted = true;

      try {
        sdk.init({
          beforeSend: removeSensitiveEventData,
          dsn,
          environment,
          maxBreadcrumbs: 0,
          release: release || undefined,
          sendDefaultPii: false,
        });
        initialized = true;
      } catch (error) {
        console.error("No se pudo iniciar Sentry en el frontend:", error);
      }
    }

    if (!initialized) return undefined;

    return {
      onCaughtError: createReactErrorHandler("React contuvo un error:"),
      onRecoverableError: createReactErrorHandler("React recuperó un error:"),
      onUncaughtError: createReactErrorHandler("Error no controlado en React:"),
    };
  }

  return { initialize };
}

const errorReporting = createErrorReporting(config.sentry);

export { createErrorReporting, errorReporting, removeSensitiveEventData };

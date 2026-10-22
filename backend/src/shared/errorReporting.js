import * as Sentry from "@sentry/node";

import config from "../config.js";

/**
 * Crea una copia del evento de Sentry sin `request` ni `user` para evitar el
 * envío de datos personales.
 *
 * @param {object} event Evento que Sentry está por enviar.
 * @returns {object} Copia saneada del evento; el original no se modifica.
 */
function removeSensitiveEventData(event) {
  const sanitizedEvent = { ...event };

  delete sanitizedEvent.request;
  delete sanitizedEvent.user;

  return sanitizedEvent;
}

/**
 * Construye el adaptador de reportes para mantener el SDK fuera de la
 * composición HTTP y poder reemplazarlo en los test.
 *
 * @param options Configuración pública de Sentry.
 * @param sdk SDK compatible con `@sentry/node`.
 * @returns Adaptador para iniciar, capturar y vaciar reportes.
 */
function createErrorReporter(options, sdk = Sentry) {
  const { dsn, environment, release } = options;
  let initializationAttempted = false;
  let initialized = false;

  function initialize() {
    if (!dsn || initializationAttempted) return initialized;

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
      console.error("No se pudo iniciar Sentry en el backend:", error);
    }

    return initialized;
  }

  /** Captura un error sin adjuntar cookies, cabeceras ni cuerpos HTTP. */
  function captureException(error, context) {
    if (!initialized) return undefined;
    if (!context) return sdk.captureException(error);

    return sdk.withScope((scope) => {
      scope.setContext("contexto", context);
      return sdk.captureException(error);
    });
  }

  /** Espera los envíos pendientes antes de terminar el proceso. */
  function close(timeout = 2_000) {
    if (!initialized) return Promise.resolve(true);
    return sdk.close(timeout);
  }

  /** Observa la respuesta del transporte para confirmar eventos operativos. */
  function subscribeToSentEvents(callback) {
    if (!initialized) return () => undefined;
    return sdk.getClient()?.on("afterSendEvent", callback) ?? (() => undefined);
  }

  return { captureException, close, initialize, subscribeToSentEvents };
}

const errorReporter = createErrorReporter(config.sentry);

export { createErrorReporter, errorReporter, removeSensitiveEventData };

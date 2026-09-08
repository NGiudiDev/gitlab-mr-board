/**
 * Error de negocio que ya sabe con qué código HTTP responder.
 *
 * Lo comparten las features porque todas necesitan lo mismo: traducir una
 * regla incumplida —nombre tomado, contraseña que no coincide, ID de proyecto
 * inválido— a una respuesta con un mensaje en español.
 */
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Traduce a una respuesta HTTP cualquier error de un handler.
 *
 * Sólo los `HttpError` conservan su código y su mensaje; el resto se registra
 * con contexto y se responde como error interno, para no filtrar detalles de
 * implementación al navegador.
 *
 * @param response Respuesta de Express en curso.
 * @param error Error capturado.
 * @param context Descripción de la operación para el log del servidor.
 */
function respondWithHttpError(response, error, context) {
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  console.error(`Error inesperado ${context}:`, error);
  response.status(500).json({ error: 'Error interno del servidor.' });
}

export { HttpError, respondWithHttpError };

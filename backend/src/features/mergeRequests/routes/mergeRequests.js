import express from "express";

import config from "../../../config.js";
import { HttpError, respondWithHttpError } from "../../../shared/httpError.js";
import { getAllMergeRequests } from "../services/mergeRequestService.js";

const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * Crea el router con una caché aislada y dependencias reemplazables para los
 * test de integración.
 *
 * La caché es **por cuenta**: sus miembros consultan GitLab con las mismas
 * credenciales, así que comparten la respuesta y el equipo entero cuesta una
 * sola consulta. Lo único propio de cada persona es con qué nickname se
 * reconoce en el tablero, y eso se completa al responder.
 */
export function createMergeRequestsRouter(params) {
  const {
    fetchMergeRequests = getAllMergeRequests,
    gitlabSettingsService,
    mergeRequestUploadDateService,
    now = () => Date.now()
  } = params;

  const router = express.Router();
  const cacheByAccountId = new Map();

  /**
   * Devuelve la respuesta reutilizable mientras siga dentro del TTL y
   * corresponda a la configuración vigente.
   *
   * Guardar la fecha de la configuración evita tener que avisarle a este
   * router cuando alguien cambia los proyectos o el token de la cuenta.
   */
  function getFreshCache(accountId, credentials) {
    const entry = cacheByAccountId.get(accountId);

    if (!entry) return null;
    if (entry.settingsVersion !== credentials.updatedAt) return null;
    if (now() - entry.storedAt >= config.cacheTtlMs) return null;

    return entry.data;
  }

  /** Reemplaza la caché solo después de completar una consulta satisfactoria. */
  function storeInCache(accountId, credentials, data) {
    cacheByAccountId.set(accountId, {
      settingsVersion: credentials.updatedAt,
      data,
      storedAt: now(),
    });
  }

  /**
   * Marca en la respuesta con qué nickname de GitLab se reconoce quien pregunta.
   *
   * La respuesta guardada es de la cuenta, así que la identidad del lector se
   * aplica recién al entregarla: dos personas de la misma cuenta reciben los
   * mismos merge requests con distinto `viewerUsername`.
   */
  async function withAccountData(data, accountId, viewerUsername) {
    const uploadDates = await mergeRequestUploadDateService.list(accountId);
    const uploadDateByMergeRequest = new Map(
      uploadDates.map((entry) => [
        `${entry.projectId}-${entry.mergeRequestIid}`,
        entry.uploadDate,
      ]),
    );

    return {
      ...data,
      mergeRequests: data.mergeRequests.map((mergeRequest) => ({
        ...mergeRequest,
        uploadDate: uploadDateByMergeRequest.get(
          `${mergeRequest.projectId}-${mergeRequest.iid}`,
        ) ?? null,
      })),
      meta: { ...data.meta, viewerUsername },
    };
  }

  /** Busca el MR sobre la misma versión del tablero que está viendo la cuenta. */
  function findCachedMergeRequest(accountId, projectId, mergeRequestIid) {
    const cachedData = cacheByAccountId.get(accountId)?.data;
    if (!cachedData) return null;

    return cachedData.mergeRequests.find((mergeRequest) => (
      String(mergeRequest.projectId) === projectId
      && mergeRequest.iid === mergeRequestIid
    )) ?? null;
  }

  router.get("/pull-requests", async (request, response) => {
    const { accountId, gitlabUsername } = response.locals.user;

    // La configuración vive en una base remota: si no se puede leer, el
    // problema es de la base y no de GitLab ni de la configuración.
    let credentials;

    try {
      credentials = await gitlabSettingsService.getCredentials(accountId);
    } catch (error) {
      console.error("Error al leer la configuración de GitLab:", error);
      response.status(503).json({ error: "No se pudo leer la configuración de GitLab de tu cuenta." });
      return;
    }

    if (!credentials) {
      response.status(409).json({
        error: "Todavía no hay datos de GitLab configurados en esta cuenta.",
        code: "gitlab_settings_missing",
      });
      return;
    }

    const forceRefresh = request.query.force === "true";
    const freshCache = forceRefresh ? null : getFreshCache(accountId, credentials);

    if (freshCache) {
      try {
        response.json(await withAccountData(freshCache, accountId, gitlabUsername));
      } catch (error) {
        console.error("Error al leer las fechas de subida de los merge requests:", error);
        response.status(503).json({ error: "No se pudieron leer las fechas de subida." });
      }
      return;
    }

    let data;

    try {
      data = await fetchMergeRequests(credentials);
      storeInCache(accountId, credentials, data);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      console.error("Error al obtener los merge requests:", error);
      response.status(502).json({ error: "No se pudieron obtener los merge requests de GitLab.", detail });
      return;
    }

    try {
      response.json(await withAccountData(data, accountId, gitlabUsername));
    } catch (error) {
      console.error("Error al leer las fechas de subida de los merge requests:", error);
      response.status(503).json({ error: "No se pudieron leer las fechas de subida." });
    }
  });

  router.put(
    "/pull-requests/:projectId/:mergeRequestIid/upload-date",
    async (request, response) => {
      const { accountId } = response.locals.user;
      const { projectId, mergeRequestIid: rawMergeRequestIid } = request.params;

      if (!NUMERIC_ID_PATTERN.test(projectId) || !NUMERIC_ID_PATTERN.test(rawMergeRequestIid)) {
        response.status(400).json({ error: "El proyecto y el merge request deben tener IDs numéricos." });
        return;
      }

      const mergeRequestIid = Number(rawMergeRequestIid);
      if (mergeRequestIid < 1) {
        response.status(400).json({ error: "El ID del merge request debe ser mayor que cero." });
        return;
      }

      const mergeRequest = findCachedMergeRequest(accountId, projectId, mergeRequestIid);
      if (!mergeRequest) {
        response.status(404).json({
          error: "El merge request no está en el tablero actual de tu cuenta.",
        });
        return;
      }

      if (mergeRequest.mergeability !== "ready_to_merge") {
        response.status(409).json({
          error: "Sólo se puede indicar la fecha de subida de un merge request listo para mergear.",
        });
        return;
      }

      try {
        const result = await mergeRequestUploadDateService.save(
          accountId,
          projectId,
          mergeRequestIid,
          request.body?.uploadDate,
        );
        response.json(result);
      } catch (error) {
        if (error instanceof HttpError) {
          respondWithHttpError(response, error, "al guardar la fecha de subida");
          return;
        }

        console.error("Error al guardar la fecha de subida del merge request:", error);
        response.status(503).json({ error: "No se pudo guardar la fecha de subida." });
      }
    },
  );

  return router;
}

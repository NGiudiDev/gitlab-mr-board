# Arquitectura del backend

Aplicación Node.js con Express y ES modules. `backend/package.json` declara `"type": "module"` y todos los imports relativos incluyen la extensión `.js`.

- `src/index.js`: CORS, JSON, health check, rutas y errores globales.
- `src/config.js`: carga y valida `backend/.env`.
- `src/routes/mergeRequests.js`: `GET /api/pull-requests` y caché en memoria.
- `src/services/gitlabApi.js`: cliente de GitLab y paginación.
- `src/services/mergeRequestService.js`: obtiene, enriquece y clasifica MRs.
- `src/utils/rateLimiter.js`: limita a seis las llamadas concurrentes.

`GET /health` informa el estado y número de proyectos. `GET /api/pull-requests` devuelve los MRs consolidados; `?force=true` omite la caché. Los errores de GitLab producen HTTP 502 y los no controlados HTTP 500.

La respuesta completa se conserva durante `POLL_CACHE_TTL_MS`. Para cada MR se consultan aprobaciones, discusiones y último pipeline.

# Arquitectura del backend

Aplicación Node.js con Express, TypeScript estricto y ES modules. `tsconfig.json` usa `NodeNext`; por eso los imports relativos del código `.ts` incluyen la extensión `.js` que tendrán al compilarse.

- `src/index.ts`: punto de entrada; construye la app y escucha el puerto.
- `src/app.ts`: `createApp()` con CORS, JSON, health check, rutas y errores globales.
- `src/config.ts`: carga y valida `backend/.env`.
- `src/types.ts`: contratos de GitLab y del dominio.
- `src/routes/mergeRequests.ts`: `createMergeRequestsRouter()` con `GET /api/pull-requests` y caché en memoria.
- `src/services/gitlabApi.ts`: cliente tipado de GitLab y paginación.
- `src/services/mergeRequestService.ts`: obtiene y enriquece los MRs consultando GitLab.
- `src/services/mergeRequestRules.ts`: reglas puras de clasificación y ruta del proyecto.
- `src/utils/isMergeRequestBlocked.ts`: decide si un MR tiene un bloqueo técnico (conflictos, pipeline fallido o cancelado, discusiones abiertas) y si merece la advertencia `mr_warning` (además, pipeline sin terminar).
- `src/utils/rateLimiter.ts`: limita a seis las llamadas concurrentes.
- `test/`: fixtures de la API de GitLab y utilidades de prueba.

`createApp()` y `createMergeRequestsRouter()` aceptan la fuente de datos y el reloj de la caché por inyección. Así las pruebas ejecutan la aplicación en memoria con fixtures locales, sin abrir un puerto ni consultar GitLab.

`GET /health` informa el estado y número de proyectos. `GET /api/pull-requests` devuelve los MRs consolidados; `?force=true` omite la caché. Los errores de GitLab producen HTTP 502 y los no controlados HTTP 500.

La respuesta completa se conserva durante `POLL_CACHE_TTL_MS`. Para cada MR se consultan aprobaciones, discusiones y último pipeline.

`npm run dev` ejecuta TypeScript directamente con recarga, `npm run typecheck` valida tipos y `npm run build` genera ES modules en `dist/`.

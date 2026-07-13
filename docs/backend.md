# Backend — GitLab MR Board API

## Descripcion general

El backend implementa el patron BFF: un servidor intermedio cuya unica responsabilidad es servir datos al frontend del dashboard. No es una API generica ni un microservicio reutilizable, sino una capa dedicada que:

1. **Protege credenciales**: El token de GitLab vive en el servidor y nunca llega al navegador.
2. **Consolida datos**: Una sola request del frontend dispara multiples consultas a GitLab (MRs + approvals + discussions + pipelines) y devuelve un JSON unificado.
3. **Optimiza rendimiento**: Cache server-side y control de concurrencia evitan saturar la API de GitLab.

## Flujo de datos

```
Frontend (Vue.js)
    │
    │  GET /api/pull-requests
    ▼
routes/mergeRequests.js ──── Cache en memoria (TTL configurable)
    │
    │  Si cache vencido o force=true
    ▼
services/mergeRequestService.js
    │
    ├── Paso 1: Para cada PROJECT_ID en paralelo
    │   └── GET /projects/:id/merge_requests?state=opened
    │
    ├── Paso 2: Para cada MR, en paralelo (rate-limited):
    │   ├── GET /projects/:id/merge_requests/:iid/approvals
    │   ├── GET /projects/:id/merge_requests/:iid/discussions
    │   └── GET /projects/:id/merge_requests/:iid/pipelines
    │
    ├── Paso 3: Computa mergeability (backlog/gray/attention/red/review/yellow/green)
    │
    └── Retorna JSON consolidado al frontend
```

## Manejo de errores

La estrategia es **degradacion elegante** (graceful degradation):

| Nivel          | Comportamiento                                                              |
|----------------|-----------------------------------------------------------------------------|
| Proyecto entero falla | Se loguea el error y se excluye ese proyecto. Los demas se muestran. |
| Approvals falla      | El MR se muestra con `approvals.status: "unknown"`.                  |
| Discussions falla    | El MR se muestra con `threads.status: "unknown"`.                    |
| Pipeline falla       | El MR se muestra con `pipeline.status: "none"`.                      |
| Todos los proyectos  | Se retorna HTTP 502 con detalle del error.                           |
| Error inesperado     | Se retorna HTTP 500 con mensaje generico.                            |

## Consideraciones de GitLab

- **Rate limits**: GitLab.com permite 300 requests/minuto para usuarios autenticados. El rate limiter y el cache estan disenados para mantenerse dentro de este limite.
- **Approvals API**: Solo disponible en GitLab Premium/Ultimate. En GitLab Free el endpoint retorna 403 y el backend degrada a `"unknown"`.
- **Paginacion**: Se limita a 10 paginas (1000 MRs por proyecto) como safety cap.
- **Instancias self-managed**: Funcionan igual, solo cambiar `GITLAB_BASE_URL` en el `.env`.

## Estructura del codigo

```
src/
├── index.js                     # Entry point: Express app, CORS, middlewares
├── config.js                    # Carga y validacion de variables de entorno
├── routes/
│   └── mergeRequests.js         # Ruta GET /api/pull-requests con cache
├── services/
│   ├── gitlabApi.js             # Cliente HTTP para GitLab API v4
│   └── mergeRequestService.js   # Orquestacion: lista MRs + enriquecimiento
└── utils/
    └── rateLimiter.js           # Semaforo de concurrencia para requests
```

## Modulos

### `src/config.js`

Carga las variables de entorno desde `.env` usando `dotenv`. Valida que las requeridas (`GITLAB_TOKEN`, `PROJECT_IDS`) esten presentes y termina el proceso con un mensaje claro si faltan.

Exporta un objeto `config` con los valores ya parseados (IDs como array, puerto como numero, `teamLeadUsername`, `minApprovals`, etc.).

### `src/services/gitlabApi.js`

Cliente HTTP generico para la API de GitLab v4. Provee dos niveles:

- **`fetchJson(path, params)`**: Request unica con header `PRIVATE-TOKEN`. Maneja errores HTTP con mensajes descriptivos (401 = token invalido, 404 = recurso no encontrado).
- **`fetchPaginated(path, params)`**: Sigue la paginacion de GitLab a traves del header `x-next-page`, hasta un maximo de 10 paginas (safety cap).
- **`fetchWithLimit` / `fetchPaginatedWithLimit`**: Wrappers que pasan las funciones anteriores por el rate limiter para controlar concurrencia.

### `src/services/mergeRequestService.js`

Orquesta toda la logica de negocio:

- **`fetchOpenMRsForProject(projectId)`**: Trae los MRs abiertos de un proyecto.
- **`fetchApprovals(projectId, mrIid)`**: Consulta el estado de aprobaciones via `/approvals`. Usa `approved_by.length` para contar approvals reales, verifica si el team lead (`config.teamLeadUsername`) aprobo, y requiere al menos `config.minApprovals`. Si falla (ej: GitLab Free), retorna `status: "unknown"`.
- **`fetchUnresolvedThreads(projectId, mrIid)`**: Cuenta los hilos de discusion no resueltos usando el endpoint de discussions.
- **`fetchPipeline(projectId, mrIid)`**: Consulta el pipeline mas reciente del MR via `/pipelines` (endpoint dedicado, no se usa `head_pipeline` del MR porque no siempre esta disponible).
- **`computeMergeability(mr, approvals, threads, pipeline)`**: Evalua los bloqueantes y labels (`backlog`, `qa_approved`) para asignar un estado: `backlog`, `gray`, `attention`, `red`, `review`, `yellow` o `green`.
- **`enrichMR(mr)`**: Compone todas las funciones anteriores para enriquecer un MR crudo de GitLab.
- **`fetchProjectPath(projectId)`**: Obtiene el `path_with_namespace` de un proyecto via `GET /projects/:id`.
- **`getAllMergeRequests()`**: Entry point principal. Consulta todos los proyectos en paralelo, enriquece cada MR, ordena por fecha de actualizacion. Incluye `allProjects` en el meta con los paths de todos los proyectos configurados.

### `src/utils/rateLimiter.js`

Implementacion de un semaforo basado en Promises para limitar la concurrencia de requests a la API de GitLab.

- **Concurrencia maxima**: 6 requests simultaneos (configurable en el constructor).
- **Funcionamiento**: `acquire()` espera un slot disponible, `release()` libera el slot o atiende al siguiente en la cola. `run(fn)` envuelve una funcion asincrona con acquire/release automatico.
- **Justificacion**: Con 10 proyectos y 50 MRs, el enriquecimiento genera ~160 requests. Sin limitar, esto podria saturar la API de GitLab (limite de 300 req/min en gitlab.com). Con concurrencia 6, se completa en ~3 segundos sin riesgo.

### `src/routes/mergeRequests.js`

Define la ruta `GET /pull-requests` (montada bajo `/api` en index.js). Implementa:

- **Cache en memoria**: Guarda la ultima respuesta exitosa con timestamp. Si llega una request dentro del TTL, retorna el cache sin consultar GitLab.
- **Bypass de cache**: Con `?force=true` (usado por el boton "Refrescar ahora" del frontend).
- **Manejo de errores**: Retorna 502 con mensaje descriptivo si GitLab falla.

### `src/index.js`

Entry point de la aplicacion Express. Configura:

- **CORS**: Permite requests desde `localhost:5173` (Vite dev) y `localhost:4173` (Vite preview).
- **Health check**: `GET /health` retorna estado y cantidad de proyectos.
- **Error handler global**: Captura errores no manejados y retorna 500 con mensaje generico.

# Endpoints

## GET /health

Health check del servidor.

### Response `200 OK`

```json
{
  "status": "ok",
  "projects": 3
}
```

| Campo      | Tipo   | Descripcion                            |
|------------|--------|----------------------------------------|
| `status`   | string | Siempre `"ok"` si el servidor responde |
| `projects` | number | Cantidad de proyectos configurados     |

---

## GET /api/pull-requests

Retorna todos los Merge Requests abiertos de los proyectos configurados, enriquecidos con informacion de bloqueantes.

### Query Parameters

| Parametro | Tipo    | Default | Descripcion                                              |
|-----------|---------|---------|----------------------------------------------------------|
| `force`   | string  | `false` | Si es `"true"`, ignora el cache y consulta GitLab en vivo |

### Response `200 OK`

```json
{
  "mergeRequests": [
    {
      "id": "12345-42",
      "iid": 42,
      "title": "Fix login timeout issue",
      "url": "https://gitlab.com/my-org/backend/-/merge_requests/42",
      "author": "Juan Perez",
      "authorAvatar": "https://gitlab.com/uploads/-/system/user/avatar/123/avatar.png",
      "projectPath": "my-org/backend",
      "projectId": 12345,
      "sourceBranch": "fix/login-timeout",
      "targetBranch": "main",
      "labels": ["bug", "priority::high"],
      "isDraft": false,
      "hasConflicts": false,
      "updatedAt": "2026-07-10T14:30:00.000Z",
      "createdAt": "2026-07-08T10:00:00.000Z",
      "blockers": {
        "approvals": {
          "status": "pending",
          "required": 2,
          "given": 1,
          "approvers": ["user1"],
          "hasLeadApproval": false,
          "missingApprovers": []
        },
        "threads": {
          "status": "open",
          "unresolvedCount": 3
        },
        "pipeline": {
          "status": "success",
          "pipelineUrl": "https://gitlab.com/my-org/backend/-/pipelines/98765"
        }
      },
      "mergeability": "red"
    }
  ],
  "meta": {
    "fetchedAt": "2026-07-10T15:00:00.000Z",
    "projectCount": 3,
    "totalMRs": 15,
    "allProjects": ["my-org/backend", "my-org/frontend", "my-org/shared"]
  }
}
```

### Campos del Merge Request

| Campo            | Tipo     | Descripcion                                          |
|------------------|----------|------------------------------------------------------|
| `id`             | string   | Identificador unico: `{projectId}-{iid}`            |
| `iid`            | number   | ID interno del MR dentro del proyecto                |
| `title`          | string   | Titulo del MR                                        |
| `url`            | string   | Link directo al MR en GitLab                         |
| `author`         | string   | Nombre del autor                                     |
| `authorAvatar`   | string?  | URL del avatar del autor (puede ser `null`)          |
| `projectPath`    | string   | Path del proyecto (ej: `my-org/backend`)             |
| `projectId`      | number   | ID numerico del proyecto en GitLab                   |
| `sourceBranch`   | string   | Rama origen                                          |
| `targetBranch`   | string   | Rama destino                                         |
| `labels`         | string[] | Lista de labels asignados al MR                      |
| `isDraft`        | boolean  | `true` si el MR es draft/WIP                         |
| `hasConflicts`   | boolean  | `true` si tiene conflictos con la rama destino       |
| `updatedAt`      | string   | Fecha de ultima actualizacion (ISO 8601)             |
| `createdAt`      | string   | Fecha de creacion (ISO 8601)                         |
| `blockers`       | object   | Objeto con los 3 bloqueantes analizados              |
| `mergeability`   | string   | Estado de mergeabilidad: `green`, `yellow`, `red`, `gray`, `review`, `attention`, `backlog` |

### Objeto `blockers.approvals`

| Campo              | Tipo     | Descripcion                                      |
|--------------------|----------|--------------------------------------------------|
| `status`           | string   | `"approved"`, `"pending"` o `"unknown"`          |
| `required`         | number   | Cantidad de approvals requeridos (configurable via `MIN_APPROVALS`) |
| `given`            | number   | Cantidad de approvals otorgados (conteo real de `approved_by`) |
| `approvers`        | string[] | Usernames de GitLab de quienes aprobaron         |
| `hasLeadApproval`  | boolean  | `true` si el team lead (configurable via `TEAM_LEAD_USERNAME`) aprobo |
| `missingApprovers` | string[] | Nombres de los aprobadores faltantes             |

> **Nota**: El endpoint de approvals requiere GitLab Premium o Ultimate. En GitLab Free retorna `status: "unknown"`.
>
> Un MR se considera `"approved"` cuando tiene al menos `MIN_APPROVALS` approvals y uno de ellos es del team lead.

### Objeto `blockers.threads`

| Campo             | Tipo   | Descripcion                                 |
|-------------------|--------|---------------------------------------------|
| `status`          | string | `"resolved"`, `"open"` o `"unknown"`        |
| `unresolvedCount` | number | Cantidad de hilos de discusion sin resolver  |

### Objeto `blockers.pipeline`

| Campo         | Tipo    | Descripcion                                               |
|---------------|---------|-----------------------------------------------------------|
| `status`      | string  | `"success"`, `"failed"`, `"running"`, `"pending"`, `"canceled"`, `"none"` o `"unknown"` |
| `pipelineUrl` | string? | Link al pipeline en GitLab (puede ser `null`)             |

### Logica de `mergeability`

El campo `mergeability` se calcula en el backend segun esta prioridad:

| Valor       | Condicion                                                              |
|-------------|------------------------------------------------------------------------|
| `backlog`   | El MR tiene el label `backlog`                                         |
| `gray`      | El MR es draft o WIP                                                   |
| `attention` | Tiene label `qa_approved` pero esta bloqueado (conflictos, CI fallido, hilos abiertos) |
| `red`       | Tiene conflictos, pipeline fallo/cancelado, o hilos abiertos           |
| `review`    | Faltan approvals (minimo 2, incluyendo el del team lead)               |
| `yellow`    | Pipeline corriendo/pendiente, o falta el label `qa_approved`           |
| `green`     | Pipeline ok, hilos resueltos, approvals completos, y label `qa_approved` |

### Labels que afectan mergeability

| Label          | Efecto                                                                   |
|----------------|--------------------------------------------------------------------------|
| `backlog`      | Mueve el MR a estado `backlog` (se evalua primero, antes que draft)      |
| `qa_approved`  | Requerido para llegar a `green`. Si presente pero bloqueado, va a `attention` |

### Response `502 Bad Gateway`

Cuando la comunicacion con GitLab falla:

```json
{
  "error": "No se pudieron obtener los merge requests de GitLab.",
  "detail": "Token inválido o sin permisos (scope read_api requerido)."
}
```

### Response `500 Internal Server Error`

Error inesperado del servidor:

```json
{
  "error": "Error interno del servidor."
}
```

---

## Cache

El endpoint `/api/pull-requests` implementa un cache en memoria con TTL configurable (`POLL_CACHE_TTL_MS`, default 60 segundos).

- Las requests normales devuelven datos del cache si no vencio el TTL.
- Con `?force=true` se ignora el cache y se consulta GitLab en vivo.
- El cache se actualiza automaticamente tras cada consulta exitosa.

Esto evita saturar la API de GitLab cuando multiples clientes (tabs del navegador) consultan simultaneamente.

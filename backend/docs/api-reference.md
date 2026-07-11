# API Reference — Backend

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
          "missingApprovers": ["Maria Garcia"]
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
    "totalMRs": 15
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
| `mergeability`   | string   | Estado de mergeabilidad: `green`, `yellow`, `red`, `gray` |

### Objeto `blockers.approvals`

| Campo              | Tipo     | Descripcion                                      |
|--------------------|----------|--------------------------------------------------|
| `status`           | string   | `"approved"`, `"pending"` o `"unknown"`          |
| `required`         | number   | Cantidad de approvals requeridos                 |
| `given`            | number   | Cantidad de approvals otorgados                  |
| `missingApprovers` | string[] | Nombres de los aprobadores faltantes             |

> **Nota**: El endpoint de approvals requiere GitLab Premium o Ultimate. En GitLab Free retorna `status: "unknown"`.

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

| Valor      | Condicion                                                    |
|------------|--------------------------------------------------------------|
| `gray`     | El MR es draft o WIP                                         |
| `red`      | Tiene conflictos, pipeline fallo/cancelado, o hilos abiertos |
| `yellow`   | Approvals pendientes, o pipeline corriendo/pendiente         |
| `green`    | Pipeline ok, hilos resueltos, approvals completos            |

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

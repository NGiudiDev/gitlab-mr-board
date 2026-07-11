# Arquitectura del Backend

## Patron BFF (Backend-for-Frontend)

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
    │   └── GET /projects/:id/merge_requests/:iid/discussions
    │   (Pipeline se extrae del campo head_pipeline del MR)
    │
    ├── Paso 3: Computa mergeability (green/yellow/red/gray)
    │
    └── Retorna JSON consolidado al frontend
```

## Modulos

### `src/config.js`

Carga las variables de entorno desde `.env` usando `dotenv`. Valida que las requeridas (`GITLAB_TOKEN`, `PROJECT_IDS`) esten presentes y termina el proceso con un mensaje claro si faltan.

Exporta un objeto `config` con los valores ya parseados (IDs como array, puerto como numero, etc.).

### `src/services/gitlabApi.js`

Cliente HTTP generico para la API de GitLab v4. Provee dos niveles:

- **`fetchJson(path, params)`**: Request unica con header `PRIVATE-TOKEN`. Maneja errores HTTP con mensajes descriptivos (401 = token invalido, 404 = recurso no encontrado).
- **`fetchPaginated(path, params)`**: Sigue la paginacion de GitLab a traves del header `x-next-page`, hasta un maximo de 10 paginas (safety cap).
- **`fetchWithLimit` / `fetchPaginatedWithLimit`**: Wrappers que pasan las funciones anteriores por el rate limiter para controlar concurrencia.

### `src/services/mergeRequestService.js`

Orquesta toda la logica de negocio:

- **`fetchOpenMRsForProject(projectId)`**: Trae los MRs abiertos de un proyecto.
- **`fetchApprovals(projectId, mrIid)`**: Consulta el estado de aprobaciones. Si falla (ej: GitLab Free no tiene este endpoint), retorna `status: "unknown"` en lugar de romper.
- **`fetchUnresolvedThreads(projectId, mrIid)`**: Cuenta los hilos de discusion no resueltos usando el endpoint de discussions.
- **`extractPipeline(mr)`**: Extrae el estado del pipeline desde el campo `head_pipeline` del MR (no hace request adicional).
- **`computeMergeability(mr, approvals, threads, pipeline)`**: Evalua los bloqueantes y asigna un color (green/yellow/red/gray).
- **`enrichMR(mr)`**: Compone todas las funciones anteriores para enriquecer un MR crudo de GitLab.
- **`getAllMergeRequests()`**: Entry point principal. Consulta todos los proyectos en paralelo, enriquece cada MR, ordena por fecha de actualizacion.

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

## Manejo de errores

La estrategia es **degradacion elegante** (graceful degradation):

| Nivel          | Comportamiento                                                              |
|----------------|-----------------------------------------------------------------------------|
| Proyecto entero falla | Se loguea el error y se excluye ese proyecto. Los demas se muestran. |
| Approvals falla      | El MR se muestra con `approvals.status: "unknown"`.                  |
| Discussions falla    | El MR se muestra con `threads.status: "unknown"`.                    |
| Todos los proyectos  | Se retorna HTTP 502 con detalle del error.                           |
| Error inesperado     | Se retorna HTTP 500 con mensaje generico.                            |

## Consideraciones de GitLab

- **Rate limits**: GitLab.com permite 300 requests/minuto para usuarios autenticados. El rate limiter y el cache estan disenados para mantenerse dentro de este limite.
- **Approvals API**: Solo disponible en GitLab Premium/Ultimate. En GitLab Free el endpoint retorna 403 y el backend degrada a `"unknown"`.
- **Paginacion**: Se limita a 10 paginas (1000 MRs por proyecto) como safety cap.
- **Instancias self-managed**: Funcionan igual, solo cambiar `GITLAB_BASE_URL` en el `.env`.

## Dependencias

| Paquete   | Version | Proposito                              |
|-----------|---------|----------------------------------------|
| `express` | ^4.21   | Framework HTTP                         |
| `cors`    | ^2.8    | Middleware CORS para desarrollo local  |
| `dotenv`  | ^16.4   | Carga de variables de entorno desde .env |

No se usan librerias HTTP externas — se usa el `fetch` nativo de Node.js 18+.

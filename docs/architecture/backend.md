# Arquitectura del backend

El backend es un **Backend for Frontend (BFF)** construido con Node.js, Express y TypeScript estricto. Mantiene el token de GitLab fuera del navegador, consolida la información de varios proyectos y entrega al frontend un contrato adaptado al tablero.

Usa ES modules y la resolución `NodeNext`. Por ese motivo, los imports relativos de los archivos `.ts` incluyen la extensión `.js` que tendrán después de la compilación.

## Responsabilidades por capa

La implementación separa el transporte HTTP, la lógica de negocio y la integración externa:

- `src/index.ts`: crea la aplicación e inicia el servidor en el puerto configurado. No contiene rutas ni lógica de negocio.
- `src/app.ts`: construye Express mediante `createApp()`, configura CORS y JSON, registra el health check, monta los routers y centraliza los errores no controlados.
- `src/config.ts`: carga `backend/.env`, valida las variables obligatorias y expone la configuración normalizada.
- `src/routes/`: define los contratos HTTP, valida entradas, administra la caché de la respuesta y traduce errores a estados HTTP.
- `src/services/gitlabApi.ts`: encapsula autenticación, construcción de URLs, paginación y acceso limitado a la API v4 de GitLab.
- `src/services/mergeRequestService.ts`: coordina las consultas, enriquece los merge requests y construye la respuesta del BFF.
- `src/services/mergeRequestRules.ts`: contiene reglas puras de clasificación y normalización que no dependen de Express ni de la red.
- `src/utils/`: aloja utilidades reutilizables, como el limitador de concurrencia y las reglas de bloqueo técnico.
- `src/types.ts`: define los contratos recibidos desde GitLab y los modelos expuestos por el backend.
- `test/`: contiene configuración, fixtures y utilidades compartidas por las pruebas del paquete. Las convenciones se mantienen en la [estrategia de pruebas](../development/pruebas.md).

## Construcción y arranque

`createApp()` construye la aplicación sin abrir un puerto. `src/index.ts` es el único responsable de invocar `listen()`. Esta separación permite ejecutar pruebas de integración en memoria y reutilizar la aplicación en diferentes entornos de ejecución.

Tanto `createApp()` como `createMergeRequestsRouter()` aceptan por inyección la fuente de merge requests y el reloj usado por la caché. Las pruebas unitarias y de integración pueden controlar sus dependencias sin consultar GitLab ni depender del tiempo real.

## Flujo de una consulta

Una solicitud a `GET /api/pull-requests` atraviesa el siguiente flujo:

1. El router responde con la caché vigente, salvo que la solicitud incluya `?force=true`.
2. El servicio consulta en paralelo los merge requests abiertos y la ruta de cada proyecto configurado.
3. Cada merge request se enriquece en paralelo con aprobaciones, discusiones y el último pipeline.
4. El cliente de GitLab limita a seis las operaciones concurrentes.
5. Las reglas puras calculan la clasificación del merge request.
6. Los resultados se ordenan por fecha de actualización descendente y se agregan los metadatos de la consulta.
7. El router conserva la respuesta completa en memoria y la devuelve al frontend.

No existe una base de datos. Cada proceso mantiene su propia caché y la pierde al reiniciarse.

## Integración con GitLab

`gitlabApi.ts` usa la API v4 y envía `GITLAB_TOKEN` mediante el encabezado `PRIVATE-TOKEN`. El token necesita el alcance `read_api` y nunca se incluye en la respuesta al navegador.

Las consultas paginadas solicitan hasta 100 elementos por página y recorren como máximo diez páginas. El encabezado `x-next-page` de GitLab determina si existe una página siguiente.

El `RateLimiter` permite hasta seis operaciones concurrentes. Las funciones del resto del backend deben acceder a GitLab mediante `fetchWithLimit()` o `fetchPaginatedWithLimit()` para respetar este límite.

## Enriquecimiento y tolerancia a fallos

El backend prioriza entregar una vista parcial antes que descartar toda la respuesta cuando falla información secundaria:

- Si falla la consulta de merge requests de un proyecto, se registra el error y ese proyecto aporta una lista vacía.
- Si no se puede obtener la ruta de un proyecto, se usa `project-<id>` como nombre de respaldo.
- Si fallan las aprobaciones o las discusiones, su estado pasa a `unknown`.
- Si falla la consulta del pipeline, su estado pasa a `none`.
- Si falla la operación global de la ruta, el backend responde HTTP 502 con un mensaje contextual.
- Los errores no controlados llegan al middleware global y producen HTTP 500.

Las reglas de clasificación permanecen en funciones puras para que el orden de prioridades pueda probarse sin red ni estado compartido.

## Caché

`createMergeRequestsRouter()` mantiene una única respuesta en memoria por instancia del router. Su duración se configura con `POLL_CACHE_TTL_MS`, cuyo valor predeterminado es 60 segundos.

- Una solicitud normal reutiliza la caché mientras el TTL siga vigente.
- `GET /api/pull-requests?force=true` omite la lectura de la caché, vuelve a consultar GitLab y reemplaza el valor almacenado.
- La caché solo se actualiza después de obtener una respuesta satisfactoria.
- Varias instancias del backend no comparten caché entre sí.

## Endpoints

### `GET /health`

Devuelve el estado del proceso y la cantidad de proyectos configurados. Sirve como prueba de vida, pero no comprueba la conectividad ni las credenciales de GitLab.

### `GET /api/pull-requests`

Devuelve los merge requests consolidados en `mergeRequests` y un objeto `meta` con la fecha de consulta, cantidad de proyectos, total de resultados y nombres de todos los proyectos configurados.

El parámetro opcional `force=true` fuerza la actualización de la caché. Cualquier otro valor se trata como una solicitud normal.

## Configuración

`src/config.ts` carga `backend/.env`. `GITLAB_TOKEN` y `PROJECT_IDS` son obligatorias; si falta alguna, el proceso informa el problema y termina. Los valores opcionales controlan la URL de GitLab, el puerto, el TTL de la caché y las reglas de aprobación.

La lista completa, sus valores predeterminados y el procedimiento de actualización se mantienen en la [guía de entorno local](../development/entorno-local.md).

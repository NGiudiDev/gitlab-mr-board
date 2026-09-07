# Arquitectura del backend

El backend es un **Backend for Frontend (BFF)** construido con Node.js, Express y TypeScript estricto. Mantiene los token de GitLab fuera del navegador, consolida la información de varios proyectos y entrega al frontend un contrato adaptado al tablero.

Usa ES modules y la resolución `NodeNext`. Por ese motivo, los imports relativos de los archivos `.ts` incluyen la extensión `.js` que tendrán después de la compilación.

## Responsabilidades por capa

La implementación separa el transporte HTTP, la lógica de negocio y la integración externa:

- `src/index.ts`: crea la aplicación e inicia el servidor en el puerto configurado. No contiene rutas ni lógica de negocio.
- `src/app.ts`: construye Express mediante `createApp()`, configura CORS y JSON, registra el health check, monta los routers —exigiendo sesión en `/api` y rol `admin` en `/api/users`— y centraliza los errores no controlados.
- `src/config.ts`: carga `backend/.env`, valida las variables obligatorias y expone la configuración normalizada.
- `src/routes/`: define los contratos HTTP, valida entradas y permisos, administra la caché de la respuesta y traduce errores a estados HTTP. `auth.ts` publica además los middlewares `createRequireSession` y `createRequireAdmin`, que el resto de los routers reutiliza.
- `src/services/gitlabApi.ts`: construye el cliente de GitLab para un access token concreto, y encapsula URLs, paginación y acceso limitado a la API v4.
- `src/services/mergeRequestService.ts`: coordina las consultas, enriquece los merge requests y construye la respuesta del BFF.
- `src/services/mergeRequestRules.ts`: contiene reglas puras de clasificación, responsabilidad y normalización que no dependen de Express ni de la red.
- `src/services/database.ts`: abre la base SQLite con `node:sqlite` y aplica el esquema. Los repositorios comparten esa única conexión, porque las claves foráneas entre sus tablas sólo valen dentro de la misma base abierta.
- `src/services/authRepository.ts`: expone el acceso a usuarios y sesiones sobre esa conexión.
- `src/services/gitlabSettingsRepository.ts`: expone el acceso a la configuración de GitLab de cada usuario.
- `src/services/gitlabSettingsService.ts`: valida los IDs de proyecto y el access token, y cifra y descifra el token con el cifrador inyectado.
- `src/services/authService.ts`: concentra las reglas de alta, registro, ingreso, vencimiento de sesión, cambio de contraseña y freno de fuerza bruta, con el repositorio y el reloj inyectados.
- `src/scripts/users.ts`: herramienta de línea de comandos para administrar usuarios. No forma parte de la API.
- `src/utils/`: aloja utilidades reutilizables, como el limitador de concurrencia, las reglas de bloqueo técnico, la derivación de contraseñas, el cifrado de secretos y la lectura de cookies.
- `src/types.ts`: centraliza los contratos recibidos desde GitLab, los modelos expuestos por el backend y los tipos internos compartidos entre capas.
- `test/`: contiene configuración, fixtures y utilidades compartidas por los test del paquete. Las convenciones se mantienen en la [estrategia de test](../development/test.md).

## Construcción y arranque

`createApp()` construye la aplicación sin abrir un puerto y `src/index.ts` es el único responsable de invocar `listen()`, así que la aplicación puede ejecutarse en memoria o en distintos entornos. Tanto `createApp()` como `createMergeRequestsRouter()` reciben por inyección la fuente de merge requests y el reloj de la caché, lo que permite controlar sus dependencias sin consultar GitLab ni depender del tiempo real. `createApp()` acepta además el servicio de autenticación y el de configuración de GitLab ya construidos; si le falta alguno, abre la base configurada en `DATABASE_PATH` y arma los dos sobre esa misma conexión.

## Flujo de una consulta

Una solicitud a `GET /api/pull-requests` atraviesa el siguiente flujo:

1. El router lee la configuración de quien pregunta y descifra su access token; sin configuración responde HTTP 409.
2. El router responde con la caché vigente de esa persona, salvo que la solicitud incluya `?force=true`.
3. El servicio construye el cliente de GitLab con ese token y consulta en paralelo los merge requests abiertos y la ruta de cada proyecto configurado.
4. Cada merge request se enriquece en paralelo con aprobaciones, discusiones y el último pipeline.
5. El limitador del proceso permite hasta seis operaciones concurrentes contra GitLab, sin importar cuántas personas consulten a la vez.
6. Las reglas puras calculan la clasificación del merge request y sus responsables.
7. Los resultados se ordenan por fecha de actualización descendente y se agregan los metadatos de la consulta, incluidas las personas participantes.
8. El router conserva la respuesta completa en memoria y la devuelve al frontend.

Los merge requests no se guardan: cada proceso mantiene su propia caché y la pierde al reiniciarse. La persistencia del backend es la base SQLite, con los usuarios y las sesiones descritos en el [dominio de autenticación](../domains/autenticacion.md) y las credenciales de GitLab en la [configuración de GitLab](../domains/configuracion-gitlab.md).

## Integración con GitLab

`gitlabApi.ts` usa la API v4 y envía mediante el encabezado `PRIVATE-TOKEN` el access token de quien consulta, que el backend descifra al armar el cliente. El token necesita el alcance `read_api` y nunca se incluye en la respuesta al navegador.

Las consultas paginadas solicitan hasta 100 elementos por página y recorren como máximo diez páginas. El encabezado `x-next-page` de GitLab determina si existe una página siguiente.

El `RateLimiter` es del proceso y permite hasta seis operaciones concurrentes: protege a la instancia de GitLab del total de consultas, sin importar en nombre de quién se hagan. Las funciones del resto del backend acceden a GitLab mediante `fetchWithLimit()` o `fetchPaginatedWithLimit()` del cliente para respetar este límite.

## Enriquecimiento y tolerancia a fallos

El backend prioriza entregar una vista parcial antes que descartar toda la respuesta cuando falla información secundaria:

- Si falla la consulta de merge requests de un proyecto, se registra el error y ese proyecto aporta una lista vacía.
- Si no se puede obtener la ruta de un proyecto, se usa `project-<id>` como nombre de respaldo.
- Si fallan las aprobaciones o las discusiones, su estado pasa a `unknown`.
- Si falla la consulta del pipeline, su estado pasa a `none`.
- Si falla la operación global de la ruta, el backend responde HTTP 502 con un mensaje contextual.
- Los errores no controlados llegan al middleware global y producen HTTP 500.

## Caché

`createMergeRequestsRouter()` mantiene en memoria **una respuesta por usuario**: cada persona consulta GitLab con su propio token, así que compartir la caché filtraría entre cuentas proyectos que no configuraron. Su duración se configura con `POLL_CACHE_TTL_MS`, cuyo valor predeterminado es 60 segundos.

- Una solicitud normal reutiliza la caché de esa persona mientras el TTL siga vigente.
- Junto a la respuesta se guarda la fecha de la configuración con la que se consultó. Cambiar los proyectos o el token la descarta, sin necesidad de avisarle al router.
- `GET /api/pull-requests?force=true` omite la lectura de la caché, vuelve a consultar GitLab y reemplaza el valor almacenado.
- La caché solo se actualiza después de obtener una respuesta satisfactoria.
- Varias instancias del backend no comparten caché entre sí.

## Endpoints

### `GET /health`

Devuelve el estado del proceso. Sirve como chequeo de vida, pero no comprueba la conectividad ni las credenciales de GitLab.

### `/api/auth/*`

Administran la sesión y la propia cuenta. `register` crea un usuario y abre su sesión; `login` recibe `{ username, password }` y responde con el usuario, entregando el token en una cookie `HttpOnly`; `logout` la invalida; `me` devuelve el usuario de la sesión vigente; `password` cambia la contraseña propia exigiendo la actual.

### `/api/users/*`

Administración de usuarios: listado, alta con rol, habilitación y restablecimiento de contraseñas. Exigen rol `admin`, no sólo sesión.

La tabla completa de permisos y las reglas —vencimiento, estados, freno de fuerza bruta y límite de registros— están en el [dominio de autenticación](../domains/autenticacion.md).

### `/api/gitlab-settings`

Configuración de GitLab de la propia cuenta: los IDs de los proyectos y el access token con el que se los consulta. Exige sesión y opera siempre sobre la configuración de quien la tiene abierta. El token se guarda cifrado y nunca vuelve al navegador. Las rutas y las reglas están en la [configuración de GitLab](../domains/configuracion-gitlab.md).

### `GET /api/pull-requests`

**Exige una sesión válida**: sin ella responde HTTP 401. Si la persona todavía no configuró GitLab responde HTTP 409 con el código `gitlab_settings_missing`. Devuelve los merge requests consolidados en `mergeRequests` y un objeto `meta` con la fecha de consulta, cantidad de proyectos, total de resultados, nombres de todos los proyectos configurados y las personas participantes en `people`.

Cada merge request incluye el nombre y el `username` del autor. El nombre se presenta en la interfaz y `authorUsername` aporta la identidad estable con la que se comparan las personas.

El backend resuelve además la responsabilidad de cada merge request en `responsiblePeople` y publica en `meta.people` la lista de autores y reviewers sin duplicados. El frontend consume ambos campos tal como llegan: las reglas se documentan en el [dominio de merge requests](../domains/merge-requests.md#responsable) y su uso, en la [vista personal](../domains/vista-personal.md).

El parámetro opcional `force=true` fuerza la actualización de la caché. Cualquier otro valor se trata como una solicitud normal.

## Configuración

`src/config.ts` carga `backend/.env`. `ENCRYPTION_KEY` es la única obligatoria; si falta, el proceso informa el problema y termina. Los valores opcionales controlan la URL de GitLab, el puerto, el TTL de la caché, las reglas de aprobación y la ubicación y duración de las sesiones. El access token y los proyectos no son configuración del proceso: los carga cada persona y se guardan en la base.

La lista completa, sus valores predeterminados y el procedimiento de actualización se mantienen en la [guía de entorno local](../development/entorno-local.md).

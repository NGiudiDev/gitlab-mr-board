# Arquitectura del backend

El backend es un **Backend for Frontend (BFF)** construido con Node.js, Express y TypeScript estricto. Mantiene los token de GitLab fuera del navegador, consolida la información de varios proyectos y entrega al frontend un contrato adaptado al tablero.

Usa ES modules y la resolución `NodeNext`. Por ese motivo, los imports relativos de los archivos `.ts` incluyen la extensión `.js` que tendrán después de la compilación.

## Organización del código

`src/` se organiza **por feature primero y por capa después**, con el mismo criterio que el frontend ([ADR 0010](../decisions/0010-backend-por-features.md)):

```text
src/
  app.ts, index.ts, config.ts     Composición, arranque y configuración
  features/
    auth/                          routes/ services/ utils/ types.ts
    gitlabSettings/                routes/ services/ utils/ types.ts
    mergeRequests/                 routes/ services/ utils/ types.ts
  shared/                          database.ts httpError.ts types.ts
  scripts/                         Herramientas de línea de comandos
```

Dentro de cada feature se mantiene la separación de capas: `routes/` define los contratos HTTP, valida entradas y permisos y traduce errores a estados HTTP; `services/` concentra la lógica de negocio y el acceso a la base y a GitLab; `utils/` guarda las piezas auxiliares que sólo usa esa feature; `types.ts` declara sus contratos.

En `shared/` va únicamente lo que usan varias features. Lo que usa una sola vive dentro de ella, aunque parezca genérico: el limitador de concurrencia pertenece a `mergeRequests` y el cifrador de secretos a `gitlabSettings`.

### Composición y entradas

- `src/index.ts`: abre la base, aplica el esquema y recién entonces inicia el servidor en el puerto configurado. No contiene rutas ni lógica de negocio.
- `src/app.ts`: construye Express mediante `createApp()`, configura CORS y JSON, registra el health check, monta los routers de cada feature —exigiendo sesión en `/api` y rol `admin` en `/api/users`— y centraliza los errores no controlados. Importa cada router por su ruta completa: no hay barrels.
- `src/config.ts`: carga `backend/.env`, valida las variables obligatorias y expone la configuración normalizada.
- `src/scripts/users.ts`: herramienta de línea de comandos para administrar usuarios. Es un punto de entrada más, como `index.ts`, y no forma parte de la API.

### Feature `auth`

- `routes/auth.ts`: sesión y cuenta propia. Publica además los middlewares `createRequireSession` y `createRequireAdmin`, que reutilizan las otras features.
- `routes/users.ts`: administración de usuarios, sólo para rol `admin`.
- `services/authRepository.ts`: acceso a usuarios y sesiones.
- `services/authService.ts`: reglas de alta, registro, ingreso, vencimiento de sesión, cambio de contraseña, borrado y freno de fuerza bruta, con el repositorio y el reloj inyectados.
- `utils/`: derivación de contraseñas y lectura de cookies.

### Feature `gitlabSettings`

- `routes/gitlabSettings.ts`: lectura, guardado y borrado de la configuración propia.
- `services/gitlabSettingsRepository.ts`: acceso a la configuración de cada usuario.
- `services/gitlabSettingsService.ts`: valida los IDs de proyecto y el access token, y cifra y descifra el token con el cifrador inyectado.
- `utils/encryption.ts`: cifrado simétrico de secretos.

### Feature `mergeRequests`

- `routes/mergeRequests.ts`: contrato de `GET /api/pull-requests` y la caché por usuario.
- `services/gitlabApi.ts`: construye el cliente de GitLab para un access token concreto, y encapsula URLs, paginación y acceso limitado a la API v4.
- `services/mergeRequestService.ts`: coordina las consultas, enriquece los merge requests y construye la respuesta del BFF.
- `services/mergeRequestRules.ts`: reglas puras de clasificación, responsabilidad y normalización que no dependen de Express ni de la red.
- `utils/`: limitador de concurrencia y reglas de bloqueo técnico.

### `shared/`

- `database.ts`: abre el pool contra Neon con `@neondatabase/serverless`, expone la interfaz mínima `Database` —`query` y `close`— y aplica el esquema. Los repositorios reciben esa interfaz y no el driver: es lo que permite ejecutarlos contra otro Postgres en los test. Comparten una única conexión, porque las claves foráneas entre sus tablas sólo valen dentro de la misma base.
- `httpError.ts`: `HttpError` —un error de negocio que ya sabe con qué código responder— y `respondWithHttpError`, que lo traduce a una respuesta y registra el resto como error interno.
- `types.ts`: los contratos de infraestructura que comparten las features.

`test/` contiene configuración, fixtures, utilidades y los contratos que sólo usan los test. Las convenciones se mantienen en la [estrategia de test](../development/test.md).

## Construcción y arranque

`createApp()` construye la aplicación sin abrir un puerto y `src/index.ts` es el único responsable de invocar `listen()`, así que la aplicación puede ejecutarse en memoria o en distintos entornos. Tanto `createApp()` como `createMergeRequestsRouter()` reciben por inyección la fuente de merge requests y el reloj de la caché, lo que permite controlar sus dependencias sin consultar GitLab ni depender del tiempo real. `createApp()` acepta además el servicio de autenticación y el de configuración de GitLab ya construidos; si le falta alguno, abre el pool de `DATABASE_URL` y arma los dos sobre esa misma conexión. Aplicar el esquema, en cambio, es responsabilidad de `src/index.ts`: la base es remota y hay que esperar a que esté lista antes de escuchar.

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

Los merge requests no se guardan: cada proceso mantiene su propia caché y la pierde al reiniciarse. La persistencia del backend es la base Postgres alojada en Neon ([ADR 0009](../decisions/0009-neon-como-base-de-datos.md)), con los usuarios y las sesiones descritos en el [dominio de autenticación](../domains/autenticacion.md) y las credenciales de GitLab en la [configuración de GitLab](../domains/configuracion-gitlab.md).

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
- Si falla la consulta a la base al validar la sesión o al leer la configuración, el backend responde HTTP 503 y no 401 ni 502: el problema no es de la sesión ni de GitLab.
- Los errores no controlados llegan al middleware global y producen HTTP 500. Express 4 no captura promesas rechazadas, así que cada handler asíncrono maneja sus propios errores.

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

`src/config.ts` carga `backend/.env`. `DATABASE_URL` y `ENCRYPTION_KEY` son obligatorias; si falta alguna, el proceso informa el problema y termina. Los valores opcionales controlan la URL de GitLab, el puerto, el TTL de la caché, las reglas de aprobación y la ubicación y duración de las sesiones. El access token y los proyectos no son configuración del proceso: los carga cada persona y se guardan en la base.

La lista completa, sus valores predeterminados y el procedimiento de actualización se mantienen en la [guía de entorno local](../development/entorno-local.md).

# Arquitectura del backend

El backend es un **Backend for Frontend (BFF)** construido con Node.js y Express, en JavaScript ([ADR 0012](../decisions/0012-javascript-sin-typescript.md)). Mantiene los token de GitLab fuera del navegador, consolida la información de varios proyectos y entrega al frontend un contrato adaptado al tablero.

Usa ES modules, así que los imports relativos llevan la extensión `.js` explícita, como exige Node. No hay compilación: Node ejecuta directamente los archivos de `src/`.

## Organización del código

`src/` se organiza **por feature primero y por capa después**, con el mismo criterio que el frontend ([ADR 0010](../decisions/0010-backend-por-features.md)):

```text
src/
  app.js, index.js, config.js     Composición, arranque y configuración
  features/
    accounts/                      routes/ services/ utils/
    auth/                          routes/ services/ utils/
    gitlabSettings/                routes/ services/ utils/
    mergeRequests/                 routes/ services/ utils/
  shared/                          database.js httpError.js
  scripts/                         Herramientas de línea de comandos
```

Dentro de cada feature se mantiene la separación de capas: `routes/` define los contratos HTTP, valida entradas y permisos y traduce errores a estados HTTP; `services/` concentra la lógica de negocio y el acceso a la base y a GitLab; `utils/` guarda las piezas auxiliares que sólo usa esa feature.

En `shared/` va únicamente lo que usan varias features. Lo que usa una sola vive dentro de ella, aunque parezca genérico: el limitador de concurrencia pertenece a `mergeRequests` y el cifrador de secretos a `gitlabSettings`.

### Composición y entradas

- `src/index.js`: prepara la aplicación y recién entonces inicia el servidor local en el puerto configurado. No contiene rutas ni lógica de negocio.
- `src/app.js`: construye Express mediante `createApp()`, abre la base y aplica el esquema mediante `createConfiguredApp()`, y exporta por omisión el handler que usa Vercel. Configura CORS y JSON, registra el health check, monta los routers de cada feature —exigiendo sesión en `/api`, y rol `admin` en `/api/users` y en la escritura de la cuenta y de la configuración de GitLab— y centraliza los errores no controlados. Importa cada router por su ruta completa: no hay barrels.
- `src/config.js`: carga `backend/.env`, valida las variables obligatorias y expone la configuración normalizada.
- `src/scripts/users.js`: herramienta de línea de comandos para administrar cuentas y usuarios. Es un punto de entrada más, como `index.js`, y no forma parte de la API.

### Feature `accounts`

- `routes/accounts.js`: lectura de la cuenta de la sesión, cambio de su nombre y renovación de su código de invitación.
- `services/accountRepository.js`: acceso a las cuentas y conteo de sus miembros.
- `services/accountService.js`: valida el nombre, resuelve el código de invitación y arma la vista pública, que incluye el código sólo para un `admin`.
- `utils/inviteCode.js`: generación y normalización del código de invitación.

### Feature `auth`

- `routes/auth.js`: sesión y datos propios —contraseña y nickname de GitLab—. Publica además los middlewares `createRequireSession` y `createRequireAdmin`, que reutilizan las otras features.
- `routes/users.js`: administración de los usuarios de la cuenta, sólo para rol `admin`.
- `services/authRepository.js`: acceso a usuarios y sesiones.
- `services/authService.js`: reglas de alta, registro, ingreso, vencimiento de sesión, cambio de contraseña y de nickname de GitLab, borrado, pertenencia a la cuenta y freno de fuerza bruta, con el repositorio, el servicio de cuentas y el reloj inyectados. El registro resuelve la cuenta —la crea, o la busca por su código—, y por eso recibe `accountService`.
- `utils/`: derivación de contraseñas, validación del nickname de GitLab y lectura de cookies.

### Feature `gitlabSettings`

- `routes/gitlabSettings.js`: lectura de la configuración de la cuenta para cualquier miembro, y guardado y borrado para un `admin`.
- `services/gitlabSettingsRepository.js`: acceso a la configuración de cada cuenta.
- `services/gitlabSettingsService.js`: valida los IDs de proyecto y el access token, y cifra y descifra el token con el cifrador inyectado.
- `utils/encryption.js`: cifrado simétrico de secretos.

### Feature `mergeRequests`

- `routes/mergeRequests.js`: contrato de `GET /api/pull-requests`, la caché por cuenta y el `viewerUsername` que se completa al responder.
- `services/gitlabApi.js`: construye el cliente de GitLab para un access token concreto, y encapsula URLs, paginación y acceso limitado a la API v4.
- `services/mergeRequestService.js`: coordina las consultas, enriquece los merge requests y construye la respuesta del BFF.
- `services/mergeRequestRules.js`: reglas puras de clasificación, responsabilidad y normalización que no dependen de Express ni de la red.
- `utils/`: limitador de concurrencia y reglas de bloqueo técnico.

### `shared/`

- `database.js`: abre el pool contra Neon con `@neondatabase/serverless`, expone la interfaz mínima `Database` —`query` y `close`— y aplica el esquema. Los repositorios reciben esa interfaz y no el driver: es lo que permite ejecutarlos contra otro Postgres en los test. Comparten una única conexión, porque las claves foráneas entre sus tablas sólo valen dentro de la misma base.
- `httpError.js`: `HttpError` —un error de negocio que ya sabe con qué código responder— y `respondWithHttpError`, que lo traduce a una respuesta y registra el resto como error interno.

`test/` contiene configuración, fixtures y utilidades de los test. Las convenciones se mantienen en la [estrategia de test](../development/test.md).

## Construcción y arranque

`createApp()` construye la aplicación sin abrir un puerto y `src/index.js` es el único responsable de invocar `listen()`, así que la aplicación puede ejecutarse en memoria o en distintos entornos. Tanto `createApp()` como `createMergeRequestsRouter()` reciben por inyección la fuente de merge requests y el reloj de la caché, lo que permite controlar sus dependencias sin consultar GitLab ni depender del tiempo real. `createApp()` acepta además los servicios de cuentas, de autenticación y de configuración de GitLab ya construidos; si le falta alguno, abre el pool de `DATABASE_URL` y arma los tres sobre esa misma conexión.

`createConfiguredApp()` abre una sola base y aplica el esquema antes de construir los servicios. El handler exportado por omisión conserva esa inicialización por proceso para las invocaciones de Vercel y la descarta si falla, de modo que una interrupción transitoria de Neon pueda reintentarse. Si la preparación no termina, responde HTTP 503; el arranque local reutiliza la misma función y no abre el puerto hasta que la base está lista.

## Flujo de una consulta

Una solicitud a `GET /api/pull-requests` atraviesa el siguiente flujo:

1. El router lee la configuración de la cuenta de quien pregunta y descifra su access token; sin configuración responde HTTP 409.
2. El router responde con la caché vigente de esa cuenta, salvo que la solicitud incluya `?force=true`.
3. El servicio construye el cliente de GitLab con ese token y consulta en paralelo los merge requests abiertos y la ruta de cada proyecto configurado.
4. Cada merge request se enriquece en paralelo con aprobaciones, discusiones y el último pipeline.
5. El limitador del proceso permite hasta seis operaciones concurrentes contra GitLab, sin importar cuántas personas consulten a la vez.
6. Las reglas puras calculan la clasificación del merge request y sus responsables.
7. Los resultados se ordenan por fecha de actualización descendente y se agregan los metadatos de la consulta, incluidas las personas participantes.
8. El router conserva la respuesta completa en memoria, le agrega en `meta.viewerUsername` el nickname de GitLab de quien preguntó y la devuelve al frontend.

Los merge requests no se guardan: cada proceso mantiene su propia caché y la pierde al reiniciarse. La persistencia del backend es la base Postgres alojada en Neon ([ADR 0009](../decisions/0009-neon-como-base-de-datos.md)), con los usuarios y las sesiones descritos en el [dominio de autenticación](../domains/autenticacion.md) y las credenciales de GitLab en la [configuración de GitLab](../domains/configuracion-gitlab.md).

## Integración con GitLab

`gitlabApi.js` usa la API v4 y envía mediante el encabezado `PRIVATE-TOKEN` el access token de quien consulta, que el backend descifra al armar el cliente. El token necesita el alcance `read_api` y nunca se incluye en la respuesta al navegador.

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

`createMergeRequestsRouter()` mantiene en memoria **una respuesta por cuenta**: sus miembros consultan GitLab con las mismas credenciales, así que comparten la respuesta y el equipo entero cuesta una sola consulta. Compartirla entre cuentas, en cambio, filtraría proyectos que no configuraron. Su duración se configura con `POLL_CACHE_TTL_MS`, cuyo valor predeterminado es 60 segundos.

- Una solicitud normal reutiliza la caché de esa cuenta mientras el TTL siga vigente.
- Lo único que no se comparte es `meta.viewerUsername`: la ruta lo completa al entregar la respuesta, así que dos personas de la misma cuenta reciben los mismos merge requests con distinta identidad.
- Junto a la respuesta se guarda la fecha de la configuración con la que se consultó. Cambiar los proyectos o el token la descarta, sin necesidad de avisarle al router.
- `GET /api/pull-requests?force=true` omite la lectura de la caché, vuelve a consultar GitLab y reemplaza el valor almacenado.
- La caché solo se actualiza después de obtener una respuesta satisfactoria.
- Varias instancias del backend no comparten caché entre sí.

## Endpoints

### `GET /health`

Devuelve el estado del proceso. Sirve como chequeo de vida, pero no comprueba la conectividad ni las credenciales de GitLab.

### `/api/auth/*`

Administran la sesión y los datos propios. `register` da de alta un usuario y abre su sesión, sumándolo a la cuenta de `inviteCode` o creando una nueva con `accountName`; `login` recibe `{ email, password }` y responde con el usuario, entregando el token en una cookie `HttpOnly`; `logout` la invalida; `me` devuelve el usuario de la sesión vigente; `profile` cambia el nombre visible y el email propios sin cerrar la sesión; `password` cambia la contraseña propia exigiendo la actual; `gitlab-username` guarda el nickname de GitLab propio sin cerrar la sesión.

### `/api/account`

La cuenta de la sesión: su nombre, cuánta gente la integra y, sólo para un `admin`, su código de invitación. Renombrarla y renovar el código exigen rol `admin`. Las reglas están en el [dominio de cuentas](../domains/cuentas.md).

### `/api/users/*`

Administración de usuarios: listado, alta con rol, habilitación y deshabilitación. Exigen rol `admin`, no sólo sesión, y alcanzan **sólo a la cuenta de quien administra**: el `email` es único en toda la base, así que sin ese límite un administrador llegaría a los usuarios de otra cuenta. Sobre alguien de otra cuenta responden 404.

No hay ruta para restablecer la contraseña de otra persona: fijarle la contraseña a alguien equivale a poder entrar como esa persona, así que la operación quedó sólo en `npm run users -- password`, que exige acceso al servidor.

La tabla completa de permisos y las reglas —vencimiento, estados, freno de fuerza bruta y límite de registros— están en el [dominio de autenticación](../domains/autenticacion.md).

### `/api/gitlab-settings`

Configuración de GitLab de la cuenta: los IDs de los proyectos y el access token con el que se los consulta. Leerla exige sesión y escribirla, rol `admin`; siempre opera sobre la cuenta de la sesión. El token se guarda cifrado y nunca vuelve al navegador. Las rutas y las reglas están en la [configuración de GitLab](../domains/configuracion-gitlab.md).

### `GET /api/pull-requests`

**Exige una sesión válida**: sin ella responde HTTP 401. Si en la cuenta todavía no se configuró GitLab responde HTTP 409 con el código `gitlab_settings_missing`. Devuelve los merge requests consolidados en `mergeRequests` y un objeto `meta` con la fecha de consulta, cantidad de proyectos, total de resultados, nombres de todos los proyectos configurados, las personas participantes en `people` y el nickname de GitLab de quien pregunta en `viewerUsername`.

Cada merge request incluye el nombre y el `username` del autor. El nombre se presenta en la interfaz y `authorUsername` aporta la identidad estable con la que se comparan las personas.

El backend resuelve además la responsabilidad de cada merge request en `responsiblePeople` y publica en `meta.people` la lista de autores y reviewers sin duplicados. El frontend consume ambos campos tal como llegan: las reglas se documentan en el [dominio de merge requests](../domains/merge-requests.md#responsable) y su uso, en la [vista personal](../domains/vista-personal.md).

El parámetro opcional `force=true` fuerza la actualización de la caché. Cualquier otro valor se trata como una solicitud normal.

## Configuración

`src/config.js` carga `backend/.env`. `DATABASE_URL` y `ENCRYPTION_KEY` son obligatorias; si falta alguna, el proceso informa el problema y termina. Los valores opcionales controlan la URL de GitLab, el puerto, el TTL de la caché, las reglas de aprobación y la ubicación y duración de las sesiones. El access token y los proyectos no son configuración del proceso: los carga un administrador de cada cuenta y se guardan en la base.

La lista completa, sus valores predeterminados y el procedimiento de actualización se mantienen en la [guía de entorno local](../development/entorno-local.md).

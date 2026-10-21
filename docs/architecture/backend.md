# Arquitectura del backend

El backend es un **Backend for Frontend (BFF)** construido con Node.js, Express y JavaScript. Mantiene los secretos fuera del navegador, concentra las reglas de negocio y publica un contrato preparado para la interfaz.

## Responsabilidades

- Autenticar sesiones y validar permisos.
- Aislar los datos por cuenta.
- Administrar usuarios, cuentas y configuración de GitLab.
- Consultar, enriquecer y clasificar merge requests.
- Persistir datos propios en Postgres y mantener una caché temporal de GitLab.
- Traducir fallos externos en respuestas HTTP consistentes.
- Reportar a Sentry los errores no controlados sin exponer datos sensibles.

## Organización del código

`backend/src/` se organiza por feature y luego por capa:

```text
src/
  app.js, index.js, config.js
  features/
    accounts/          routes/ services/ utils/
    auth/              routes/ services/ utils/
    gitlabSettings/    routes/ services/ utils/
    mergeRequests/     routes/ services/ utils/
    users/             routes/ services/ utils/
  shared/              database.js httpError.js
  scripts/             herramientas operativas
```

- `routes/` define contratos HTTP, valida entradas y aplica permisos.
- `services/` contiene reglas de negocio e integración con datos o servicios externos.
- `utils/` reúne auxiliares exclusivos de una feature.
- `shared/` contiene únicamente infraestructura usada por varias features.
- `app.js` compone Express; `index.js` inicia el servidor local; `config.js` valida la configuración.

No hay barrels. Cada import identifica el archivo dueño del contrato.

## Construcción y arranque

`createApp()` construye Express sin abrir un puerto y permite inyectar servicios para los test. `createConfiguredApp()` abre un único pool de Neon, aplica el esquema idempotente y construye las dependencias compartidas antes de aceptar solicitudes.

Si la base no está disponible durante la preparación, el backend responde HTTP 503 y permite reintentar la inicialización. El proceso local no abre el puerto hasta completar ese paso.

## Flujo del tablero

Una solicitud a `GET /api/pull-requests` sigue este recorrido:

1. Valida la sesión y obtiene la cuenta desde ella.
2. Lee y descifra la configuración de GitLab de esa cuenta.
3. Reutiliza la caché vigente, salvo que se solicite `force=true`.
4. Consulta proyectos y merge requests respetando el límite de concurrencia.
5. Enriquece cada resultado con aprobaciones, discusiones y pipeline.
6. Aplica reglas puras de clasificación y responsabilidad.
7. Agrega fechas persistidas y la identidad de quien consulta.
8. Devuelve el contrato consolidado al frontend.

Las reglas funcionales están en [Merge Requests](../domains/merge-requests.md); este documento sólo describe cómo circulan los datos.

## Persistencia

PostgreSQL en Neon es la fuente de verdad para cuentas, usuarios, sesiones, configuración de GitLab y fechas de subida. Los repositorios dependen de una interfaz mínima `Database` con `query` y `close`, por lo que los test pueden usar PGlite sin acoplar el dominio al driver.

El pool se abre una vez por proceso y se comparte entre repositorios. La decisión y sus consecuencias están en el [ADR 0007](../decisions/0007-neon-como-base-de-datos.md).

## Integración con GitLab

El cliente usa la API v4 con un access token cifrado de la cuenta. El token necesita alcance `read_api` y nunca vuelve al navegador. Las consultas paginadas solicitan hasta 100 elementos por página y un limitador permite como máximo seis operaciones simultáneas por proceso.

Cuando falla información secundaria, el backend conserva una respuesta parcial: aprobaciones y discusiones quedan como `unknown`, el pipeline como `none` y un proyecto sin nombre recibe uno de respaldo. Un fallo global de GitLab responde HTTP 502.

## Caché

La caché de merge requests vive en memoria y mantiene una entrada por cuenta durante `POLL_CACHE_TTL_MS`.

- Los miembros de una cuenta comparten los datos obtenidos de GitLab.
- `meta.viewerUsername` y las fechas de subida se agregan al responder y no forman parte de la entrada compartida.
- Cambiar los proyectos o el token invalida la entrada mediante la fecha de la configuración.
- `force=true` omite la lectura y reemplaza la entrada después de una consulta satisfactoria.
- Las instancias del backend no comparten caché.

## Seguridad y errores

- Las rutas privadas de `/api` exigen sesión; login, registro y recuperación son excepciones públicas explícitas. Las operaciones administrativas también exigen rol `admin`.
- El `accountId` se toma de la sesión y nunca del cuerpo de la petición.
- Consultar un recurso de otra cuenta responde 404 para no revelar su existencia.
- Los access token se guardan cifrados y las contraseñas, derivadas.
- Un fallo de persistencia responde 503; uno de GitLab, 502; un error no controlado, 500.
- Express 4 no captura promesas rechazadas, por lo que cada handler asíncrono maneja sus errores.

El alcance y las reglas de privacidad de los reportes están en [Observabilidad](observabilidad.md).

## API

| Ruta | Propósito | Permiso |
|---|---|---|
| `GET /health` | Estado del proceso. | Público |
| `/api/auth/*` | Registro, login, sesión y contraseña propia. | Según operación |
| `/api/account` | Cuenta e invitación. | Sesión; escritura de admin |
| `/api/users/*` | Perfil propio y gestión de integrantes. | Sesión; gestión de admin |
| `/api/gitlab-settings` | Configuración compartida de GitLab. | Sesión; escritura de admin |
| `GET /api/pull-requests` | Tablero consolidado. | Sesión |
| `PUT /api/pull-requests/:projectId/:mergeRequestIid/upload-date` | Fecha de subida de un MR listo. | Sesión |

Los cuerpos, estados y reglas de cada operación se mantienen en [Dominios](../domains/). La configuración del proceso está en el [README de la raíz](https://github.com/NGiudiDev/gitlab-mr-board/blob/main/README.md#backend).

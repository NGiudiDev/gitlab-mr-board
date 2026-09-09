# Entorno local

## Requisitos e instalación

Se requieren Node.js 24, npm 10+, acceso a GitLab y una base de [Neon](https://neon.com). Ejecutar `npm ci` en la raíz, `backend/` y `frontend/`, y copiar `backend/.env.example` como `backend/.env`.

El PAT `read_api` y los IDs de los proyectos no van en el `.env`: los carga un administrador de cada cuenta desde «Mi cuenta» y el backend los guarda en la base con el token cifrado ([configuración de GitLab](../domains/configuracion-gitlab.md)).

La versión mayor queda fijada en Node 24 para mantener el mismo runtime en desarrollo y producción. Los tres `package.json` —raíz, `backend/` y `frontend/`— lo declaran mediante `engines`, así que `npm install` advierte con `EBADENGINE` si el runtime no lo cumple. No hay una comprobación propia del proyecto: con una versión incompatible el aviso llega en la instalación y, más adelante, desde la herramienta que no la soporte.

Para comprobar el runtime efectivo en Windows:

```powershell
node --version
where.exe node
```

Después de actualizar Node.js hay que abrir una terminal nueva y ejecutar nuevamente `npm ci` en la raíz, `backend/` y `frontend/`. Esto evita conservar binarios opcionales generados para el runtime anterior.

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `DATABASE_URL` | Sí | — | Cadena de conexión de Neon; conviene la del pooler |
| `ENCRYPTION_KEY` | Sí | — | Clave con la que se cifran los access token guardados; mínimo 32 caracteres |
| `GITLAB_BASE_URL` | No | `https://gitlab.com` | Instancia de GitLab |
| `PORT` | No | `3001` | Puerto del backend |
| `POLL_CACHE_TTL_MS` | No | `60000` | TTL en milisegundos |
| `TEAM_LEAD_USERNAME` | No | `NGiudi` | Aprobación del líder |
| `MIN_APPROVALS` | No | `2` | Mínimo de aprobaciones |
| `SESSION_DURATION_DAYS` | No | `7` | Días que dura una sesión |
| `COOKIE_SECURE` | No | `true` con `NODE_ENV=production` | Exige HTTPS en la cookie de sesión |

El frontend usa esta variable, expuesta por Vite durante el build:

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:3001` en desarrollo; mismo origen en producción | URL base HTTP(S) del backend |

`frontend/src/config.js` valida el valor y elimina la barra final. `frontend/.env.example` contiene la configuración recomendada para desarrollo local. En Vercel la variable se deja sin definir: el frontend usa su propio origen y `frontend/vercel.json` reescribe `/api` hacia el proyecto del backend, evitando CORS y cookies de terceros. Vite solo expone al navegador variables con el prefijo `VITE_`; nunca colocar secretos en ellas.

## Base de datos

El backend persiste en Neon ([ADR 0009](../decisions/0009-neon-como-base-de-datos.md)). Alcanza con crear un proyecto y copiar en `DATABASE_URL` la cadena de conexión **del pooler** —la que trae `-pooler` en el host—: el backend abre su propio pool y las conexiones directas de Postgres son un recurso escaso.

El esquema se aplica solo en cada arranque, así que no hay ningún paso de migración. Para no pisarse entre desarrolladores conviene una rama de Neon por persona; son copias instantáneas y se descartan sin costo.

## Generar la clave de cifrado

`ENCRYPTION_KEY` protege los access token guardados en la base y es obligatoria. Para generar una:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Hay que respaldarla junto con la base: cambiarla vuelve ilegibles los tokens ya guardados y obliga a cargarlos de nuevo.

## Primer usuario

El tablero exige sesión. En una instalación nueva alcanza con abrir el frontend y usar «Crear una cuenta»: **el primer usuario registrado queda administrador**, así que puede administrar al resto desde «Usuarios».

Si preferís crearlo por línea de comandos, desde la raíz:

```bash
npm run users --prefix backend -- create ana --name "Ana Pérez" --role admin
```

La contraseña se pide por teclado. El esquema se crea solo en la base de `DATABASE_URL`; para empezar de cero, lo más rápido es descartar la rama de Neon y crear otra. Los tres caminos de alta, los subcomandos —incluido `delete`, que borra un usuario con sus sesiones y su configuración de GitLab— y las reglas de contraseñas están en el [dominio de autenticación](../domains/autenticacion.md).

## Ejecución

`npm run dev` desde la raíz inicia ambos servicios en una sola terminal, en cualquier sistema operativo. Usa [concurrently](https://www.npmjs.com/package/concurrently): prefija cada línea con `backend` o `frontend` para saber quién la emitió, Ctrl+C detiene los dos, y `--kill-others-on-fail` baja el proceso restante si uno falla al arrancar —así un `.env` incompleto no deja el frontend corriendo contra un backend inexistente—. Los scripts `dev:backend` y `dev:frontend` permiten levantar uno solo.

Dentro de `backend/`, `npm run dev` agrega recarga ante cambios con `node --watch` y `npm start` lo ejecuta una sola vez. Los comandos de validación están en la [estrategia de test](test.md) y los builds productivos en la [guía de despliegue](../deployment/produccion.md).

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Salud: `http://localhost:3001/health`

Si el backend no inicia, revisar las variables obligatorias y que la base de Neon responda: el proceso aplica el esquema antes de escuchar, así que una base inalcanzable lo detiene con un mensaje explícito en lugar de dejarlo respondiendo errores. Un HTTP 409 indica que en la cuenta todavía no se cargaron los datos de GitLab en «Mi cuenta». Un HTTP 502 indica un error al consultar GitLab; comprobar token, permisos, URL e IDs. Un HTTP 401 significa que falta la sesión y un 403 que falta el rol `admin`. Si nadie puede entrar, `npm run users` es el camino de recuperación, y `npm run users -- accounts` recupera el código de invitación de una cuenta.

## Sitio de documentación

`docs/` se publica como sitio estático con VitePress, agregado como dependencia de desarrollo en la raíz ([ADR 0004](../decisions/0004-sitio-de-documentacion.md)). Desde la raíz:

| Comando | Uso |
|---|---|
| `npm run docs:dev` | Servidor local con recarga en `http://localhost:5175` |
| `npm run docs:build` | Genera el sitio en `docs/.vitepress/dist/` |
| `npm run docs:preview` | Sirve el resultado del build |

Al agregar un documento hay que sumarlo al sidebar de `docs/.vitepress/config.mjs`; si no, la página existe pero queda fuera de la navegación. El build falla ante enlaces internos rotos, así que conviene ejecutar `npm run docs:build` antes de entregar cambios de documentación.

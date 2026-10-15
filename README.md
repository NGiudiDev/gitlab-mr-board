# GitLab MR Board

GitLab MR Board es un tablero web que reúne los Merge Requests abiertos de varios proyectos de GitLab y los organiza según su estado de mergeabilidad. Muestra aprobaciones, discusiones pendientes, pipelines, conflictos y responsables sin exponer el token de GitLab en el navegador: un administrador de cada cuenta carga los proyectos y el access token desde «Mi cuenta», el backend lo guarda cifrado y el resto del equipo se suma con un código de invitación.

## Requisitos

- Node.js 24.
- npm 10 o superior.
- Una base Postgres en [Neon](https://neon.com).
- Acceso a los proyectos de GitLab que se mostrarán en el tablero.

## Instalación

Clonar el repositorio e instalar las dependencias de los tres paquetes:

```bash
git clone https://github.com/NGiudiDev/gitlab-mr-board.git
cd gitlab-mr-board
npm ci
npm ci --prefix backend
npm ci --prefix frontend
```

Copiar `backend/.env.example` como `backend/.env` y completar, como mínimo, `DATABASE_URL` y `ENCRYPTION_KEY`. `frontend/.env.example` sólo hace falta si se quiere sobrescribir la URL predeterminada del backend.

Después de cambiar la versión de Node.js, abrir una terminal nueva y repetir los tres `npm ci` para no conservar binarios opcionales generados para el runtime anterior.

## Configuración

Crear un proyecto en Neon y usar en `DATABASE_URL` la cadena de conexión del pooler, cuyo host contiene `-pooler`. El backend aplica el esquema al arrancar, por lo que no hay un paso de migración manual.

Generar una clave de cifrado con:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

`ENCRYPTION_KEY` debe respaldarse junto con la base: cambiarla vuelve ilegibles los access token guardados y obliga a cargarlos nuevamente.

### Backend

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `DATABASE_URL` | Sí | — | Cadena de conexión de Neon; se recomienda la del pooler |
| `ENCRYPTION_KEY` | Sí | — | Clave de al menos 32 caracteres para cifrar los access token |
| `GITLAB_BASE_URL` | No | `https://gitlab.com` | Instancia de GitLab |
| `NODE_ENV` | No | — | En `production` habilita SMTP y la cookie segura; usar `development` localmente |
| `PORT` | No | `3001` | Puerto del backend |
| `POLL_CACHE_TTL_MS` | No | `60000` | TTL de la caché en milisegundos |
| `TEAM_LEAD_USERNAME` | No | `NGiudi` | Username cuya aprobación cuenta como la del líder |
| `MIN_APPROVALS` | No | `2` | Cantidad mínima de aprobaciones |
| `SESSION_DURATION_DAYS` | No | `7` | Duración de una sesión en días |
| `PASSWORD_RESET_DURATION_MINUTES` | No | `30` | Vigencia del enlace para restablecer una contraseña |
| `FRONTEND_BASE_URL` | Sí en producción | `http://localhost:5173` | Origen público usado en los enlaces de restablecimiento |
| `COOKIE_SECURE` | No | `true` con `NODE_ENV=production` | Exige HTTPS en la cookie de sesión |
| `MAIL_FROM` | Sí en producción | `GitLab MR Board <no-reply@localhost>` | Remitente de los correos de restablecimiento |
| `SMTP_HOST` | Sí en producción | — | Servidor SMTP |
| `SMTP_PORT` | No | `587` | Puerto del servidor SMTP |
| `SMTP_SECURE` | No | `false` | Usa TLS desde el inicio; normalmente `true` con el puerto 465 |
| `SMTP_USER` | No | — | Usuario SMTP; debe configurarse junto con `SMTP_PASSWORD` |
| `SMTP_PASSWORD` | No | — | Contraseña SMTP; debe configurarse junto con `SMTP_USER` |

En desarrollo, los correos no se envían: el enlace de restablecimiento se escribe en la terminal. Los proyectos y el PAT con alcance `read_api` no son variables de entorno; un administrador los carga desde «Mi cuenta» y el backend los guarda en la base con el token cifrado.

### Frontend

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:3001` en desarrollo; mismo origen en producción | URL base HTTP(S) del backend |

Vite expone al navegador todas las variables con prefijo `VITE_`; nunca deben contener secretos.

## Ejecución

Iniciar el backend y el frontend desde la raíz:

```bash
npm run dev
```

El comando mantiene ambos procesos en una terminal y los detiene juntos con `Ctrl+C`. También se pueden iniciar por separado:

| Comando | Servicio |
|---|---|
| `npm run dev:backend` | Backend con recarga en `http://localhost:3001` |
| `npm run dev:frontend` | Frontend con recarga en `http://localhost:5173` |

El chequeo de vida del backend está disponible en `http://localhost:3001/health`.

En una base nueva, abrir el frontend y elegir «Crear una cuenta»: el primer usuario registrado queda como administrador. Después debe cargar el PAT y los proyectos de GitLab desde «Mi cuenta». Como alternativa, se puede crear el primer usuario desde la terminal:

```bash
npm run users --prefix backend -- create ana@example.com --name "Ana Pérez" --role admin
```

## Validación y documentación

La estrategia y los comandos de test están en [`docs/development/test.md`](docs/development/test.md). Antes de entregar cambios, ejecutar desde la raíz:

```bash
npm test
npm run lint
```

La documentación técnica vive en [`docs/`](docs/README.md) y se publica con VitePress:

| Comando | Uso |
|---|---|
| `npm run docs:dev` | Inicia el sitio local de documentación |
| `npm run docs:build` | Genera y valida el sitio estático |
| `npm run docs:preview` | Sirve el build generado |

Las reglas para contribuir están en [`AGENTS.md`](AGENTS.md).

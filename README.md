# GitLab MR Board

Dashboard unificado de Merge Requests de GitLab para trackear bloqueantes de multiples proyectos en un solo lugar.

## Motivacion

En equipos que trabajan con multiples repositorios en GitLab, es comun perder visibilidad sobre el estado real de los Merge Requests: cuales estan bloqueados por approvals pendientes, cuales tienen hilos de discusion sin resolver, cuales tienen el pipeline roto. Este dashboard consolida toda esa informacion en una vista unica con indicadores visuales claros.

## Arquitectura

El proyecto usa un patron **Backend-for-Frontend (BFF)**:

```
┌──────────────┐     GET /api/pull-requests      ┌──────────────┐     GitLab API v4      ┌──────────┐
│   Frontend   │  ─────────────────────────────► │   Backend    │  ───────────────────►  │  GitLab  │
│   (Vue.js)   │  ◄───────────────────────────── │  (Express)   │  ◄───────────────────  │          │
│   Port 5173  │         JSON limpio             │   Port 3001  │     PRIVATE-TOKEN      │          │
└──────────────┘                                 └──────────────┘                        └──────────┘
```

- **Backend**: Guarda el token de GitLab de forma segura, consulta la API, enriquece cada MR con datos de bloqueantes y devuelve un JSON consolidado.
- **Frontend**: Consume el JSON del backend y lo presenta en un tablero visual con colores por estado.

## Estructura del proyecto

```
gitlab-mr-board/
├── backend/                  # Node.js + Express (BFF)
│   ├── src/
│   │   ├── index.js              # Entry point del servidor
│   │   ├── config.js             # Configuracion desde variables de entorno
│   │   ├── routes/
│   │   │   └── mergeRequests.js  # GET /api/pull-requests
│   │   ├── services/
│   │   │   ├── gitlabApi.js      # Cliente HTTP para la API de GitLab
│   │   │   └── mergeRequestService.js  # Logica de negocio y enriquecimiento
│   │   └── utils/
│   │       └── rateLimiter.js    # Rate limiter para requests a GitLab
│   ├── .env.example          # Template de configuracion
│   └── package.json
│
├── frontend/                 # Vue.js 3 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.vue
│   │   ├── composables/
│   │   │   └── useMergeRequests.js  # Fetch y polling de datos
│   │   └── components/
│   │       ├── MrBoard.vue       # Tableros colapsables por repositorio
│   │       ├── BoardColumn.vue   # Columna de estado individual
│   │       ├── MrCard.vue        # Card de cada MR
│   │       ├── BlockerBadge.vue  # Badge de CI, hilos y approvals
│   │       ├── TopBar.vue        # Barra superior
│   │       └── SearchBar.vue     # Busqueda
│   └── package.json
│
├── docs/                     # Documentacion centralizada
│   ├── backend.md                # Arquitectura, modulos y referencia de la API
│   ├── frontend.md               # Componentes, composables, props y eventos
│   └── ui_&_ux.md                # Guia de estilos, paleta de colores y tipografia
│
├── start-dev.bat             # Script para levantar backend + frontend (Windows)
├── package.json              # npm start para desarrollo
├── AGENTS.md                 # Reglas de trabajo para agentes de IA
├── .gitignore
└── README.md
```

## Quick Start

### Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- Un **Personal Access Token (PAT)** de GitLab con scope `read_api`
- Los **IDs numericos** de los proyectos que quieras trackear

> Para encontrar el ID de un proyecto en GitLab: ir a la pagina del proyecto → Settings → General → el ID aparece debajo del nombre del proyecto.

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repo>
cd gitlab-mr-board
```

### Paso 2: Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env` con tus valores:

```env
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_BASE_URL=https://gitlab.com
PROJECT_IDS=12345,67890,11223
PORT=3001
POLL_CACHE_TTL_MS=60000
TEAM_LEAD_USERNAME=NGiudi
MIN_APPROVALS=2
```

Las unicas variables **obligatorias** son `GITLAB_TOKEN` y `PROJECT_IDS`. El resto tienen valores por defecto.

> **Seguridad**: El archivo `.env` esta incluido en `.gitignore` y nunca debe ser commiteado. El token jamas se expone al frontend.

### Paso 3: Instalar dependencias

```bash
# Desde la raiz del proyecto
cd backend && npm install
cd ../frontend && npm install
```

### Paso 4: Ejecutar

**Opcion A — Ambos juntos (recomendado para desarrollo)**

Desde la raiz del proyecto:

```bash
npm start
```

Esto ejecuta `start-dev.bat` que levanta ambos servidores en la misma terminal.

**Opcion B — Por separado**

```bash
# Terminal 1: Backend (con hot reload via node --watch)
cd backend
npm run dev

# Terminal 2: Frontend (Vite dev server con HMR)
cd frontend
npm run dev
```

**URLs de acceso:**

| Servicio  | URL                    | Descripcion                    |
|-----------|------------------------|--------------------------------|
| Frontend  | http://localhost:5173  | Dashboard (interfaz principal) |
| Backend   | http://localhost:3001  | API del BFF                    |
| Health    | http://localhost:3001/health | Verificar que el backend esta corriendo |

Al iniciar, el backend imprime los proyectos que esta rastreando:

```
Backend running on http://localhost:3001
Tracking 3 projects: 12345, 67890, 11223
```

### Paso 5: Verificar

1. Abrir http://localhost:3001/health — debe responder `{"status":"ok","projects":N}`.
2. Abrir http://localhost:5173 — debe mostrar el dashboard con los MRs de los proyectos configurados.

## Configuracion

### Variables de entorno (backend/.env)

| Variable | Descripcion | Requerida | Default |
|---|---|---|---|
| `GITLAB_TOKEN` | Token de GitLab con scope `read_api` | Si | — |
| `PROJECT_IDS` | IDs de los proyectos separados por coma | Si | — |
| `GITLAB_BASE_URL` | URL base de la instancia de GitLab | No | `https://gitlab.com` |
| `PORT` | Puerto del servidor backend | No | `3001` |
| `POLL_CACHE_TTL_MS` | Tiempo de cache de la API en ms | No | `60000` (1 min) |
| `TEAM_LEAD_USERNAME` | Username de GitLab del lider del equipo | No | `NGiudi` |
| `MIN_APPROVALS` | Cantidad minima de approvals requeridos | No | `2` |

### Frontend (frontend/.env)

| Variable | Descripcion | Default |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend | `""` (usa proxy de Vite) |

En desarrollo no hace falta configurar `VITE_API_BASE_URL` — Vite proxea `/api/*` a `http://localhost:3001` automaticamente.

Para produccion:

```env
VITE_API_BASE_URL=https://mi-backend.ejemplo.com
```

### Build para produccion

```bash
cd frontend
npm run build      # Genera archivos estaticos en frontend/dist/
npm run preview    # Preview local del build en http://localhost:4173
```

## Documentacion

La documentacion detallada del proyecto esta en la carpeta `docs/`:

| Documento | Contenido |
|---|---|
| [docs/backend.md](docs/backend.md) | Arquitectura del backend, modulos, flujo de datos y manejo de errores |
| [docs/frontend.md](docs/frontend.md) | Componentes Vue, composables, props, eventos y ciclo de vida |
| [docs/ui_&_ux.md](docs/ui_&_ux.md) | Paleta de colores, tipografia, tokens de Tailwind y guia visual |

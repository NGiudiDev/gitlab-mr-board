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
├── start-dev.bat             # Script para levantar backend + frontend
├── package.json              # npm start para desarrollo
├── .gitignore
└── README.md
```

## Quick Start

### Requisitos

- **Node.js** >= 18.0.0
- Un **Personal Access Token** de GitLab con scope `read_api`
- Los **IDs numericos** de los proyectos que quieras trackear

### 1. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus valores (ver seccion Configuracion).

> Para encontrar el ID de un proyecto en GitLab: ir a la pagina del proyecto → Settings → General → el ID aparece debajo del nombre del proyecto.

### 2. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Ejecutar

Desde el root del proyecto:

```bash
npm start
```

Esto levanta backend y frontend en la misma terminal:
- **Backend** -> http://localhost:3001
- **Frontend** -> http://localhost:5173

Tambien se pueden levantar por separado:

```bash
# Backend (con hot reload)
cd backend && npm run dev

# Frontend (Vite dev server)
cd frontend && npm run dev
```

## Configuracion

Editar `backend/.env` con los siguientes valores:

| Variable | Descripcion | Default |
|---|---|---|
| `GITLAB_TOKEN` | Token de GitLab con scope `read_api` | *requerido* |
| `GITLAB_BASE_URL` | URL base de la instancia de GitLab | `https://gitlab.com` |
| `PROJECT_IDS` | IDs de los proyectos separados por coma | *requerido* |
| `PORT` | Puerto del servidor backend | `3001` |
| `POLL_CACHE_TTL_MS` | Tiempo de cache de la API en ms | `60000` |
| `TEAM_LEAD_USERNAME` | Username de GitLab del lider del equipo | `NGiudi` |
| `MIN_APPROVALS` | Cantidad minima de approvals requeridos | `2` |

## Funcionalidades

### Vista del tablero

El tablero muestra una seccion colapsable por cada repositorio configurado. Dentro de cada seccion, los MRs se organizan en columnas por estado de mergeabilidad. Se muestran todos los proyectos configurados, incluso los que no tienen MRs abiertos. Todas las secciones inician colapsadas.

| Columna | Color | Condicion |
|---|---|---|
| **Draft** | Gris | MR en estado draft o WIP |
| **Bloqueadas** | Rojo | Conflictos, CI fallido/cancelado, o hilos sin resolver |
| **Code Review** | Azul | Faltan approvals (minimo 2, incluyendo el del team lead) |
| **Pendientes** | Amarillo | Pipeline en progreso, o falta el label `qa_approved` |
| **Requiere atencion** | Naranja | Tiene label `qa_approved` pero esta bloqueado (conflictos, CI fallido, o hilos abiertos) |
| **Listas para mergear** | Verde | CI OK, hilos resueltos, approvals completos, y label `qa_approved` |
| **Despriorizado** | Gris claro | Tiene el label `backlog` |

### Logica de mergeabilidad (orden de prioridad)

1. Label `backlog` → **Despriorizado**
2. Draft/WIP → **Draft**
3. Label `qa_approved` + bloqueado → **Requiere atencion**
4. Conflictos / CI fallido / hilos abiertos → **Bloqueadas**
5. Approvals pendientes → **Code Review**
6. Pipeline running/pending → **Pendientes**
7. Sin label `qa_approved` → **Pendientes**
8. Todo OK → **Listas para mergear**

### Reglas de approvals

Un MR se considera aprobado cuando cumple ambas condiciones:
- Tiene al menos **2 approvals** (configurable con `MIN_APPROVALS`)
- Uno de los approvals es del **team lead** (configurable con `TEAM_LEAD_USERNAME`)

El badge de approvals muestra:
- `X/2` con la cantidad de approvals dados sobre los requeridos
- Tooltip con los usernames de quienes aprobaron
- Indicador si falta la aprobacion del lider

### Labels relevantes

| Label | Efecto |
|---|---|
| `backlog` | Mueve el MR a la columna "Despriorizado" (maxima prioridad en la logica, se evalua primero) |
| `qa_approved` | Requerido para que un MR llegue a "Listas para mergear". Si esta presente pero el MR tiene bloqueantes, va a "Requiere atencion" |

### Badges de cada MR

Cada card muestra tres badges:

| Badge | Estados | Detalle |
|---|---|---|
| **Pipeline (CI)** | `CI OK`, `CI Fallo`, `CI...`, `CI Cancel`, `Sin CI` | Clickeable, abre el pipeline en GitLab |
| **Hilos** | `Hilos OK`, `N hilo(s)` | Cantidad de hilos de discusion sin resolver |
| **Approvals** | `X/2` | Approvals dados sobre los requeridos |

### Actualizacion automatica

- Polling cada 5 minutos via `setInterval`
- Boton "Refrescar ahora" para actualizacion manual inmediata (bypasea el cache)
- Cache server-side de 1 minuto para evitar saturar la API de GitLab

### Filtros

- Busqueda por texto (titulo, autor, rama, proyecto)

## API

### `GET /api/pull-requests`

Devuelve todos los MRs abiertos de los proyectos configurados, enriquecidos con datos de pipeline, approvals y hilos.

**Query params:**
- `force=true` — Ignora el cache y hace un fetch fresco a GitLab

**Response:**
```json
{
  "mergeRequests": [
    {
      "id": "123-45",
      "iid": 45,
      "title": "Feature X",
      "url": "https://gitlab.com/...",
      "author": "Nombre",
      "projectPath": "group/project",
      "sourceBranch": "feature-x",
      "targetBranch": "master",
      "labels": ["qa_approved"],
      "isDraft": false,
      "hasConflicts": false,
      "mergeability": "green",
      "blockers": {
        "pipeline": { "status": "success", "pipelineUrl": "https://..." },
        "threads": { "status": "resolved", "unresolvedCount": 0 },
        "approvals": {
          "status": "approved",
          "required": 2,
          "given": 2,
          "approvers": ["user1", "user2"],
          "hasLeadApproval": true
        }
      }
    }
  ],
  "meta": {
    "fetchedAt": "2026-07-10T00:00:00.000Z",
    "projectCount": 7,
    "totalMRs": 26,
    "allProjects": ["group/project-a", "group/project-b"]
  }
}
```

## Limitaciones conocidas

- **Approvals API**: Requiere GitLab Premium o Ultimate. En GitLab Free, el indicador de approvals muestra "?" en lugar de datos.
- **Rate limits**: GitLab.com permite 300 requests/minuto. Con muchos proyectos y MRs, considerar aumentar el TTL del cache.
- **Sin autenticacion propia**: El dashboard no tiene login — cualquiera con acceso a la URL puede ver los MRs. Adecuado para redes internas o VPN.
- **Sin persistencia**: No usa base de datos. El cache es en memoria y se pierde al reiniciar el backend.

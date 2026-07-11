# Backend — GitLab MR Board API

## Descripcion general

Servidor BFF (Backend-for-Frontend) construido con **Node.js** y **Express** que actua como intermediario seguro entre el frontend y la API de GitLab v4. Su responsabilidad principal es consultar los Merge Requests abiertos de multiples proyectos, enriquecerlos con datos de bloqueantes (approvals, hilos de discusion, pipelines) y entregar un JSON consolidado al frontend.

## Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- Un **Personal Access Token (PAT)** de GitLab con scope `read_api`

## Instalacion

```bash
cd backend
cp .env.example .env   # Completar con tus valores
npm install
```

## Configuracion

Las variables de entorno se cargan desde el archivo `.env` ubicado en la raiz de `backend/`.

| Variable             | Requerida | Default              | Descripcion                                              |
|----------------------|-----------|----------------------|----------------------------------------------------------|
| `GITLAB_TOKEN`       | Si        | —                    | Personal Access Token de GitLab (scope `read_api`)       |
| `GITLAB_BASE_URL`    | No        | `https://gitlab.com` | URL de la instancia de GitLab                            |
| `PROJECT_IDS`        | Si        | —                    | IDs numericos de proyectos, separados por coma           |
| `PORT`               | No        | `3001`               | Puerto en el que escucha el servidor                     |
| `POLL_CACHE_TTL_MS`  | No        | `60000`              | Tiempo de vida del cache en milisegundos (default 1 min) |
| `TEAM_LEAD_USERNAME` | No        | `NGiudi`             | Username de GitLab del lider del equipo                  |
| `MIN_APPROVALS`      | No        | `2`                  | Cantidad minima de approvals requeridos para mergear     |

### Ejemplo de `.env`

```env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_BASE_URL=https://gitlab.com
PROJECT_IDS=12345,67890,11223
PORT=3001
POLL_CACHE_TTL_MS=60000
TEAM_LEAD_USERNAME=NGiudi
MIN_APPROVALS=2
```

> **Seguridad**: El archivo `.env` esta incluido en `.gitignore` y nunca debe ser commiteado. El token jamas se expone al frontend.

## Ejecucion

```bash
# Desde el root del proyecto (levanta backend + frontend juntos)
npm start

# Solo backend en produccion
npm start

# Solo backend en desarrollo (con hot-reload usando --watch de Node.js)
npm run dev
```

Al iniciar, el servidor imprime los proyectos que esta rastreando:

```
Backend running on http://localhost:3001
Tracking 3 projects: 12345, 67890, 11223
```

## Endpoints

Documentacion detallada de la API en [api-reference.md](./api-reference.md).

| Metodo | Ruta                | Descripcion                          |
|--------|---------------------|--------------------------------------|
| GET    | `/health`           | Health check del servidor            |
| GET    | `/api/pull-requests` | Lista de MRs abiertas con bloqueantes |

## Estructura del codigo

```
src/
├── index.js                     # Entry point: Express app, CORS, middlewares
├── config.js                    # Carga y validacion de variables de entorno
├── routes/
│   └── mergeRequests.js         # Ruta GET /api/pull-requests con cache
├── services/
│   ├── gitlabApi.js             # Cliente HTTP para GitLab API v4
│   └── mergeRequestService.js   # Orquestacion: lista MRs + enriquecimiento
└── utils/
    └── rateLimiter.js           # Semaforo de concurrencia para requests
```

Documentacion detallada de la arquitectura en [architecture.md](./architecture.md).

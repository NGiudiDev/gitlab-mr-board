# Entorno local

## Requisitos e instalación

Se requieren Node.js 18+, npm 8+, acceso a GitLab, un PAT `read_api` e IDs de proyectos. Ejecutar `npm install` dentro de `backend/` y `frontend/`, y copiar `backend/.env.example` como `backend/.env`.

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `GITLAB_TOKEN` | Sí | — | PAT de GitLab |
| `PROJECT_IDS` | Sí | — | IDs separados por comas |
| `GITLAB_BASE_URL` | No | `https://gitlab.com` | Instancia de GitLab |
| `PORT` | No | `3001` | Puerto del backend |
| `POLL_CACHE_TTL_MS` | No | `60000` | TTL en milisegundos |
| `TEAM_LEAD_USERNAME` | No | `NGiudi` | Aprobación del líder |
| `MIN_APPROVALS` | No | `2` | Mínimo de aprobaciones |

El frontend admite `VITE_API_BASE_URL`; sin ella usa el proxy de Vite.

## Ejecución

En Windows, `npm start` desde la raíz inicia ambos servicios. Alternativamente, ejecutar `npm run dev` dentro de `backend/` y `frontend/` en terminales separadas.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Salud: `http://localhost:3001/health`

Si el backend no inicia, revisar las variables obligatorias. Un HTTP 502 indica un error al consultar GitLab; comprobar token, permisos, URL e IDs.

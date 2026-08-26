# Entorno local

## Requisitos e instalación

Se requieren Node.js 22+, npm 10+, acceso a GitLab, un PAT `read_api` e IDs de proyectos. Ejecutar `npm install` en la raíz, `backend/` y `frontend/`, y copiar `backend/.env.example` como `backend/.env`.

El backend valida la versión de Node antes de ejecutar desarrollo, build, typecheck o producción. El mínimo de Node 22 permite usar las versiones vigentes de las herramientas de pruebas; con una versión anterior se muestra un error descriptivo antes de cargarlas.

El paquete raíz también declara el requisito mediante `engines`. El script de Windows valida Node antes de abrir los dos procesos, por lo que un código de salida `ELIFECYCLE` después del mensaje de versión incompatible es esperado: indica que el inicio se detuvo de forma segura.

Para comprobar el runtime efectivo en Windows:

```powershell
node --version
where.exe node
```

Después de actualizar Node.js hay que abrir una terminal nueva y ejecutar nuevamente `npm install` en la raíz, `backend/` y `frontend/`. Esto evita conservar binarios opcionales generados para el runtime anterior.

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

`npm start` ejecuta el backend TypeScript directamente con `tsx`. Durante el desarrollo, `npm run dev` agrega recarga ante cambios. `npm run typecheck` valida los tipos sin generar `dist/` y `npm run build` compila el JavaScript de producción.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Salud: `http://localhost:3001/health`

Si el backend no inicia, revisar las variables obligatorias. Un HTTP 502 indica un error al consultar GitLab; comprobar token, permisos, URL e IDs.

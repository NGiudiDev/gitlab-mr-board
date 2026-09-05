# Entorno local

## Requisitos e instalación

Se requieren Node.js 22.13+, npm 10+, acceso a GitLab, un PAT `read_api` e IDs de proyectos. Ejecutar `npm ci` en la raíz, `backend/` y `frontend/`, y copiar `backend/.env.example` como `backend/.env`.

El mínimo de Node 22.13 permite usar las versiones vigentes de las herramientas de pruebas y ESLint. Los tres `package.json` —raíz, `backend/` y `frontend/`— lo declaran mediante `engines`, así que `npm install` advierte con `EBADENGINE` si el runtime no lo cumple. No hay una comprobación propia del proyecto: con una versión menor el aviso llega en la instalación y, más adelante, desde la herramienta que no la soporte.

Para comprobar el runtime efectivo en Windows:

```powershell
node --version
where.exe node
```

Después de actualizar Node.js hay que abrir una terminal nueva y ejecutar nuevamente `npm ci` en la raíz, `backend/` y `frontend/`. Esto evita conservar binarios opcionales generados para el runtime anterior.

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `GITLAB_TOKEN` | Sí | — | PAT de GitLab |
| `PROJECT_IDS` | Sí | — | IDs separados por comas |
| `GITLAB_BASE_URL` | No | `https://gitlab.com` | Instancia de GitLab |
| `PORT` | No | `3001` | Puerto del backend |
| `POLL_CACHE_TTL_MS` | No | `60000` | TTL en milisegundos |
| `TEAM_LEAD_USERNAME` | No | `NGiudi` | Aprobación del líder |
| `MIN_APPROVALS` | No | `2` | Mínimo de aprobaciones |

El frontend usa esta variable, expuesta por Vite durante el build:

| Variable | Obligatoria | Predeterminado | Uso |
|---|---:|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:3001` | URL base HTTP(S) del backend |

`frontend/src/config.js` valida el valor y elimina la barra final. `frontend/.env.example` contiene la configuración recomendada para desarrollo local. Vite solo expone al navegador variables con el prefijo `VITE_`; nunca colocar secretos en ellas.

## Ejecución

`npm run dev` desde la raíz inicia ambos servicios en una sola terminal, en cualquier sistema operativo. Usa [concurrently](https://www.npmjs.com/package/concurrently): prefija cada línea con `backend` o `frontend` para saber quién la emitió, Ctrl+C detiene los dos, y `--kill-others-on-fail` baja el proceso restante si uno falla al arrancar —así un `.env` incompleto no deja el frontend corriendo contra un backend inexistente—. Los scripts `dev:backend` y `dev:frontend` permiten levantar uno solo.

Dentro de `backend/`, `npm run dev` agrega recarga ante cambios con `tsx watch` y `npm start` lo ejecuta una sola vez. Los comandos de validación están en la [estrategia de pruebas](pruebas.md) y los builds productivos en la [guía de despliegue](../deployment/produccion.md).

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Salud: `http://localhost:3001/health`

Si el backend no inicia, revisar las variables obligatorias. Un HTTP 502 indica un error al consultar GitLab; comprobar token, permisos, URL e IDs.

## Sitio de documentación

`docs/` se publica como sitio estático con VitePress, agregado como dependencia de desarrollo en la raíz ([ADR 0004](../decisions/0004-sitio-de-documentacion.md)). Desde la raíz:

| Comando | Uso |
|---|---|
| `npm run docs:dev` | Servidor local con recarga en `http://localhost:5175` |
| `npm run docs:build` | Genera el sitio en `docs/.vitepress/dist/` |
| `npm run docs:preview` | Sirve el resultado del build |

Al agregar un documento hay que sumarlo al sidebar de `docs/.vitepress/config.mjs`; si no, la página existe pero queda fuera de la navegación. El build falla ante enlaces internos rotos, así que conviene ejecutar `npm run docs:build` antes de entregar cambios de documentación.

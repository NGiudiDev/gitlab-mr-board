# GitLab MR Board

GitLab MR Board es un tablero web que reúne los Merge Requests abiertos de varios proyectos de GitLab y los organiza según su estado de mergeabilidad. Muestra aprobaciones, discusiones pendientes, pipelines, conflictos y responsables sin exponer el token de GitLab en el navegador.

## Requisitos

- Node.js 18 o superior.
- npm 8 o superior.
- Un Personal Access Token de GitLab con alcance `read_api`.
- Los IDs numéricos de los proyectos que se quieren monitorear.

## Puesta en marcha

1. Instalar dependencias en `backend/` y `frontend/` con `npm install`.
2. Copiar `backend/.env.example` como `backend/.env` y completar, como mínimo:

   ```env
   GITLAB_TOKEN=glpat-xxxxxxxxxxxx
   PROJECT_IDS=123,456,789
   ```

3. Desde la raíz, iniciar ambos servicios en Windows:

   ```powershell
   npm start
   ```

En cualquier sistema también se pueden abrir dos terminales y ejecutar `npm run dev` dentro de `backend/` y `frontend/`. El tablero queda disponible en `http://localhost:5173`, el backend en `http://localhost:3001` y su comprobación de estado en `GET /health`.

La configuración completa está en la [guía de desarrollo](docs/development/entorno-local.md).

## Tests

El proyecto todavía no tiene una suite automatizada ni scripts `test`. Antes de entregar cambios se realizan las verificaciones descritas en la [estrategia de pruebas](docs/development/pruebas.md).

## Build

El frontend genera los archivos estáticos de producción en `frontend/dist/`:

```bash
cd frontend
npm run build
```

El backend usa ES modules y no requiere compilación: se ejecuta con `npm start` dentro de `backend/`. Consultar la [guía de despliegue](docs/deployment/produccion.md).

## Documentación

La documentación detallada está en [`docs/`](docs/README.md):

- [`architecture/`](docs/architecture/README.md): estructura, componentes y flujo de datos.
- [`decisions/`](docs/decisions/README.md): decisiones técnicas y sus consecuencias.
- [`development/`](docs/development/README.md): entorno local, comandos y pruebas.
- [`deployment/`](docs/deployment/README.md): build y operación en producción.
- [`domains/`](docs/domains/README.md): reglas del dominio de Merge Requests.

Las reglas para contribuir están en [`AGENTS.md`](AGENTS.md).

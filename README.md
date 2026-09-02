# GitLab MR Board

GitLab MR Board es un tablero web que reúne los Merge Requests abiertos de varios proyectos de GitLab y los organiza según su estado de mergeabilidad. Muestra aprobaciones, discusiones pendientes, pipelines, conflictos y responsables sin exponer el token de GitLab en el navegador.

La interfaz incluye navegación por teclado, foco visible, anuncios para lectores de pantalla y una paleta de alto contraste orientada a WCAG 2.2 nivel AA. La validación manual de accesibilidad se documenta en la [estrategia de pruebas](docs/development/pruebas.md).

## Requisitos

- Node.js 22 o superior. Este mínimo permite usar versiones vigentes de Vitest, Vue Test Utils y Playwright.
- npm 10 o superior.
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

Si el inicio informa una versión de Node incompatible, actualizar Node.js, cerrar y abrir la terminal para refrescar `PATH`, comprobar con `node --version` y reinstalar las dependencias con `npm install`.

## Tests

Las pruebas usan Vitest en ambos paquetes y Vue Test Utils para los componentes. No consultan GitLab ni requieren un token: la API se simula con fixtures locales.

```bash
npm test
```

Ese comando ejecuta las dos suites. También se pueden correr por separado con `npm test` dentro de `backend/` o `frontend/`, y en modo interactivo con `npm run test:watch`.

Cubren la matriz de clasificación de merge requests, el cliente de GitLab, el rate limiter, el contrato de `GET /health` y `GET /api/pull-requests` con su caché, el composable de datos y el comportamiento accesible de los componentes. Los recorridos E2E con Playwright Test son la etapa pendiente.

Antes de entregar cambios también se ejecutan typecheck, builds y las verificaciones manuales de la [estrategia de pruebas](docs/development/pruebas.md), que detalla casos, comandos y el plan gradual.

## Build

El frontend genera los archivos estáticos de producción en `frontend/dist/`:

```bash
cd frontend
npm run build
```

El backend está escrito en TypeScript. `npm start` lo ejecuta directamente con `tsx`; para producción, `npm run build` genera `dist/` y `npm run start:prod` ejecuta el JavaScript compilado. Consultar la [guía de despliegue](docs/deployment/produccion.md).

## Documentación

La documentación detallada está en [`docs/`](docs/README.md):

- [`architecture/`](docs/architecture/README.md): estructura, componentes y flujo de datos.
- [`decisions/`](docs/decisions/README.md): decisiones técnicas y sus consecuencias.
- [`development/`](docs/development/README.md): entorno local, comandos y pruebas.
- [`deployment/`](docs/deployment/README.md): build y operación en producción.
- [`domains/`](docs/domains/README.md): reglas del dominio de Merge Requests.

Esa documentación también se puede leer como sitio estático con VitePress. Desde la raíz, `npm run docs:dev` la sirve en `http://localhost:5175` con búsqueda y navegación, y `npm run docs:build` genera el sitio en `docs/.vitepress/dist/`. El motivo está en el [ADR 0004](docs/decisions/0004-sitio-de-documentacion.md).

Las reglas para contribuir están en [`AGENTS.md`](AGENTS.md).

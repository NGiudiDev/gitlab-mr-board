# GitLab MR Board

GitLab MR Board es un tablero web que reúne los Merge Requests abiertos de varios proyectos de GitLab y los organiza según su estado de mergeabilidad. Muestra aprobaciones, discusiones pendientes, pipelines, conflictos y responsables sin exponer el token de GitLab en el navegador: un administrador de cada cuenta carga los proyectos y el access token desde «Mi cuenta», el backend lo guarda cifrado y el resto del equipo se suma con un código de invitación, sin cargar ninguna credencial.

## Stack tecnológico

- **Lenguaje y runtime:** JavaScript con ES modules sobre Node.js 24.
- **Frontend:** React 19, React Router 8, styled-components 6 y Vite 6.
- **Backend:** Express 4, API de GitLab, Nodemailer y cookies de sesión HTTP-only.
- **Persistencia:** PostgreSQL en Neon mediante `@neondatabase/serverless`; PGlite para los test de integración.
- **Test:** Vitest 4, React Testing Library, happy-dom y Playwright.
- **Calidad y documentación:** ESLint 10 y VitePress 1.

## Documentación

La documentación completa vive en [`docs/`](docs/README.md). Para comenzar, consultar la guía de [entorno local](docs/development/entorno-local.md); para validar o desplegar cambios, usar las guías de [test](docs/development/test.md) y [producción](docs/deployment/produccion.md).

Persiste en [Neon](https://neon.com); la puesta a punto está en la guía de [entorno local](docs/development/entorno-local.md).

Las reglas para contribuir están en [`AGENTS.md`](AGENTS.md).

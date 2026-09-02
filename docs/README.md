# GitLab MR Board

GitLab MR Board es un tablero web que reúne los Merge Requests abiertos de varios proyectos de GitLab y los organiza según su estado de mergeabilidad. Muestra aprobaciones, discusiones pendientes, pipelines, conflictos y responsables sin exponer el token de GitLab en el navegador.

La interfaz incluye navegación por teclado, foco visible, anuncios para lectores de pantalla y una paleta de alto contraste orientada a WCAG 2.2 nivel AA. La validación manual de accesibilidad se documenta en la [estrategia de pruebas](development/pruebas.md).

El código es la fuente de verdad; estos documentos explican su estructura, decisiones y operación.

## Requisitos

- Node.js 22 o superior. Este mínimo permite usar versiones vigentes de Vitest, React Testing Library y Playwright.

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

3. Desde la raíz, iniciar ambos servicios:

   ```bash
   npm run dev
   ```

Ese comando levanta backend y frontend en la misma terminal, con la salida de cada uno prefijada; Ctrl+C detiene los dos. `npm run dev:backend` y `npm run dev:frontend` levantan uno solo. El tablero queda disponible en `http://localhost:5173`, el backend en `http://localhost:3001` y su comprobación de estado en `GET /health`.

Si `npm install` advierte que la versión de Node no cumple `engines`, actualizar Node.js, cerrar y abrir la terminal para refrescar `PATH`, comprobar con `node --version` y reinstalar las dependencias.

La configuración completa —variables de entorno, comandos y diagnóstico— está en la guía de [entorno local](development/entorno-local.md).

## Tests

Los tests usan Vitest en ambos paquetes y React Testing Library para los componentes. No hacen consultas a GitLab ni requieren un token: la API se simula con fixtures locales.

```bash
npm test
```

Ese comando ejecuta las dos suites. También se pueden correr por separado con `npm test` dentro de `backend/` o `frontend/`, y en modo interactivo con `npm run test:watch`.

Antes de entregar cambios también se ejecutan typecheck, builds y las verificaciones manuales de la [estrategia de pruebas](development/pruebas.md), que detalla casos, comandos y el plan gradual.

## Build

El frontend genera los archivos estáticos de producción en `frontend/dist/`:

```bash
cd frontend
npm run build
```

El backend está escrito en TypeScript. Dentro de `backend/`, `npm start` lo ejecuta directamente con `tsx`; para producción, `npm run build` genera `dist/` y `npm run start:prod` ejecuta el JavaScript compilado. Los detalles están en la guía de [despliegue en producción](deployment/produccion.md).

## Mantenimiento de la documentación

Actualizar la documentación junto con el comportamiento. Registrar en [`decisions/`](decisions/README.md) las elecciones estructurales y en [`domains/`](domains/README.md) las reglas funcionales.

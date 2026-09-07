# AGENTS.md — GitLab MR Board

## Reglas de Trabajo del Agente

### Idioma y Documentación

- **Todo en español**: comentarios, documentación, columnas y estados de la UI y mensajes de error visibles. En **inglés**: los mensajes de commit y los nombres de variables, funciones y archivos. A los test automatizados se los llama **test**, nunca «pruebas».

- **Escribir lo justo y no repetir**: cada concepto tiene una única fuente de verdad, incluida esta guía. En el resto de los documentos, resumir el contexto imprescindible y enlazar a esa fuente en lugar de copiar requisitos, comandos o explicaciones. Los índices sirven para navegar, no para duplicar.

- Al agregar una feature, actualizar la documentación afectada: este archivo, `docs/` y comentarios inline si aplica.

- **Toda la documentación vive en la raíz**: `AGENTS.md` y `docs/`, organizada por propósito (`architecture/`, `decisions/`, `development/`, `deployment/`, `domains/`). No crear carpetas `docs/` dentro de `backend/` ni `frontend/`.

- `docs/` se publica con VitePress (`npm run docs:dev`). Al agregar un documento, sumarlo al sidebar de `docs/.vitepress/config.mjs` y correr `npm run docs:build`, que falla ante enlaces internos rotos. Los índices de carpeta se llaman `README.md`; `rewrites` los sirve como `index.md`.

### Buenas Prácticas de Código

- **Nombres descriptivos** que expliquen el propósito sin comentarios: preferir `fetchMergeRequestApprovals` sobre `getData`.

- **Código fácil de leer**: soluciones claras y directas. Evitar abstracciones prematuras y optimizaciones que dificulten la lectura sin un beneficio comprobable.

- **Funciones pequeñas y con responsabilidad única**: cada función debe poder describirse en una oración.

- **Comentarios solo para lógica compleja** — una decisión no evidente, un workaround, una regla de negocio sutil — y siempre explicando el **por qué**, no el **qué**.

- **JSDoc en funciones auxiliares**: propósito, parámetros, retorno y errores, sin repetir lo que ya dice la firma.

- **Early returns** para reducir anidamiento; evitar `else` después de un `return`.

- **Manejar errores** en toda llamada externa u operación async, logueando con contexto suficiente para diagnosticar.

- **DRY**: si una lógica se repite en más de dos lugares, extraerla a una utilidad o a un hook.

- **Destructuring** cuando mejore la legibilidad, no por default.

### Estructura y Organización

- **Toda la lógica de negocio va en el backend**: clasificación, responsables y demás reglas del dominio se calculan en `backend/src/services/` y se publican en el contrato. El frontend sólo decide presentación —columnas, agrupación, orden, formato y filtros sobre campos ya calculados. Si una regla necesita conocer el dominio, no pertenece al frontend.

- **Separar responsabilidades por paquete**: `backend/` para la API y la integración con GitLab, `frontend/` para la aplicación React. Los scripts que coordinan ambos y la documentación compartida viven en la raíz.

- El proyecto requiere **Node.js 22.13 o superior y npm 10 o superior**, declarado en `engines` en los tres `package.json`. Mantener estas versiones sincronizadas entre sí y con la documentación.

- Mantener los imports ordenados con ESLint. Ejecutar `npm run lint` para validar o `npm run lint:fix` para corregir; el orden de grupos y la integración con el editor se documentan en [`docs/development/calidad-codigo.md`](docs/development/calidad-codigo.md).

- **No crear archivos innecesarios**: preferir editar los existentes; crear uno nuevo sólo cuando la responsabilidad no encaje en ninguno.

### Backend

- Mantener la arquitectura por capas: rutas HTTP en `backend/src/routes/`, lógica de negocio y acceso a GitLab en `backend/src/services/`, utilidades en `backend/src/utils/`.

- Mantener separado el armado de Express (`backend/src/app.ts`) del arranque del servidor (`backend/src/index.ts`), para poder probar la aplicación en memoria e inyectar sus dependencias.

- Mantener puras las reglas de `backend/src/services/mergeRequestRules.ts` e inyectar sus dependencias (fuente de datos, reloj) en lugar de acoplarlas al módulo.

- Centralizar la lectura y validación de variables de entorno en `backend/src/config.ts`. Al agregar una variable, actualizar `backend/.env.example` y la tabla de `docs/development/entorno-local.md`. **El token y los proyectos de GitLab no son configuración del proceso**: los guarda cada usuario en la base y viven en `services/gitlabSettingsService.ts`.

- Usar **TypeScript estricto y ES modules**, con extensión `.js` en los imports relativos para ser compatibles con la salida `NodeNext`.

- Las rutas validan sus parámetros y devuelven el error HTTP que corresponda (400, 404, 500, etc.). Al agregar un endpoint, documentarlo; si requiere un router nuevo, montarlo desde `backend/src/app.ts`. **Todo lo que cuelgue de `/api` exige sesión**: el middleware está montado en `createApp()` y una ruta pública nueva debe justificarse.

- La autenticación vive en `services/authRepository.ts` (acceso a la base), `services/authService.ts` (reglas), `routes/auth.ts` (sesión y cuenta propia) y `routes/users.ts` (administración), con las reglas documentadas en [`docs/domains/autenticacion.md`](docs/domains/autenticacion.md) ([ADR 0006](docs/decisions/0006-login-local-con-sqlite.md) y [ADR 0007](docs/decisions/0007-registro-abierto-y-gestion-de-usuarios.md)). No guardar credenciales fuera de esas capas, no devolver el hash de una contraseña ni el token de sesión en ninguna respuesta, y mantener el repositorio inyectable para poder correrlo contra la base en memoria de los test.

- **Las credenciales de GitLab son de cada usuario y se guardan cifradas** en `services/gitlabSettingsRepository.ts` y `services/gitlabSettingsService.ts`, con el cifrador de `utils/encryption.ts` inyectado ([`docs/domains/configuracion-gitlab.md`](docs/domains/configuracion-gitlab.md), [ADR 0008](docs/decisions/0008-credenciales-de-gitlab-por-usuario.md)). El access token **nunca** vuelve al navegador: las respuestas sólo llevan sus últimos caracteres. Toda consulta a GitLab se hace con un cliente construido a partir del token de quien pregunta, y cualquier caché de esos datos es por usuario.

- **La base es Postgres en Neon** ([ADR 0009](docs/decisions/0009-neon-como-base-de-datos.md)), así que toda la capa de datos es asíncrona. El pool se abre una sola vez en `services/database.ts` y los repositorios comparten esa conexión, porque las claves foráneas entre sus tablas sólo valen dentro de la misma base. Los repositorios reciben la interfaz mínima `Database` y nunca el driver: eso es lo que permite correrlos contra PGlite en los test.

- **Express 4 no captura promesas rechazadas**: todo handler asíncrono maneja sus propios errores. Un fallo de la base al validar la sesión o al leer la configuración responde 503, nunca 401 ni 502.

- **Los permisos se validan en el backend, ruta por ruta**: `createRequireSession` para lo que exige sesión y `createRequireAdmin` para lo que exige rol `admin`. Esconder un control en el frontend no es una barrera. Al agregar una operación de administración, montarla bajo `/api/users` y cubrir en los test el 401 sin sesión y el 403 sin rol.

- Respetar el **rate limiter** existente al llamar a la API de GitLab.

### Frontend

- Organizar cada funcionalidad en `frontend/src/features/<feature>/`, con `components/` y `hooks/`. Reservar `frontend/src/app/` para la composición general.

- La sección «Mi cuenta» reúne los datos propios: la contraseña (`features/auth/components/AccountPanel.jsx`) y la configuración de GitLab (`features/gitlabSettings/`). Al sumar algo propio de la persona, va ahí.

- **El layout y la navegación viven en `frontend/src/app/AppShell.jsx`**: la barra superior, el único `main` y el listado `SECTIONS` de secciones navegables. Al agregar una sección, sumarla a esa lista, contemplarla en `ActiveSection` de `App.jsx` y actualizar [`docs/architecture/frontend.md`](docs/architecture/frontend.md#navegación-entre-secciones). No hay router: la sección activa es estado local de `App`.

- Centralizar las variables de entorno en `frontend/src/config.js`. Al agregar una, actualizar `frontend/.env.example` y `docs/development/entorno-local.md`.

- Usar **React 19 con componentes de función** en archivos `.jsx` ([ADR 0005](docs/decisions/0005-frontend-en-react.md)), con **una responsabilidad por componente**: si crece demasiado, extraer subcomponentes dentro de su feature.

- Estilos con **Tailwind CSS** — nada de CSS custom salvo para lo que Tailwind no cubra.

- **El estado compartido va al store** de `hooks/useMergeRequests.js` para el tablero y `features/auth/hooks/useSession.js` para la sesión, ambos con `useSyncExternalStore`; `useState` queda para estado local del componente. Toda petición al backend viaja con `credentials: 'include'`.

- Al agregar o renombrar una clasificación, mantener sincronizados el tipo `Mergeability` del backend, las columnas de `mergeRequestColumns.js` y `docs/domains/merge-requests.md`. Al cambiar la asignación de responsables, modificar `computeResponsiblePeople`, cubrir las combinaciones en `mergeRequestRules.test.ts` y actualizar ese mismo documento.

- La vista por persona ([`docs/domains/vista-personal.md`](docs/domains/vista-personal.md)) filtra por el `username` que el backend marcó responsable; no recalcular ni duplicar esa regla en el frontend.

- **Los efectos se ejecutan dos veces en desarrollo** por `StrictMode`: todo `useEffect` con suscripciones, timers o peticiones debe limpiar en su retorno y ser idempotente.

- Los componentes reciben **props explícitas con valores por omisión** y avisan al padre con callbacks `onAlgo`. No mutar props ni estado.

- Mantener el objetivo de **WCAG 2.2 nivel AA**: HTML semántico, uso completo por teclado, foco visible, nombres accesibles, estados dinámicos anunciados y contraste de 4.5:1 en texto y 3:1 en controles. No comunicar un estado sólo con color, posición o iconos.

### Dependencias

- **No agregar dependencias sin justificación** — el proyecto es intencionalmente liviano. Antes de instalar, evaluar si alcanza con lo que ya hay o con código propio simple; si se agrega, documentar el motivo en el commit.

- **Usar versiones exactas**, sin `^` ni `~`, y mantener actualizado el `package-lock.json` correspondiente.

### Commits

- Formato `<type>: <description>` en inglés (por ejemplo: `feat: add author filter`, `fix: correct approval calculation`).

- Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

### Test y Entrega

- La fuente de verdad es [`docs/development/test.md`](docs/development/test.md): herramientas, comandos, convenciones, cobertura esperada por paquete, E2E y checklist de validación antes de entregar. Seguirlo en cada cambio y actualizarlo cuando la estrategia cambie.

- Ejecutar `npm test` desde la raíz antes de entregar, además de la validación manual del checklist. Los E2E corren aparte con `npm run test:e2e` y necesitan credenciales de GitLab.

- Verificar visualmente en el browser todo cambio de UI, en **tema oscuro** (el default del proyecto) y revisando la consola.

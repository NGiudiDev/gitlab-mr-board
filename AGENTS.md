# AGENTS.md — GitLab MR Board

## Reglas de Trabajo del Agente

### Idioma y Documentación

- **Todo en español**, excepto los commits: comentarios, documentación, nombres de columnas/estados en la UI y mensajes de error visibles al usuario. Los mensajes de commit deben escribirse íntegramente en inglés.

- Al agregar una feature nueva, **siempre actualizar la documentación** correspondiente: este archivo (`AGENTS.md`), la carpeta `docs/`, y comentarios inline si aplica.

- **Toda la documentación vive en la raíz del proyecto**: `AGENTS.md`, y la carpeta `docs/`. No crear carpetas `docs/` dentro de `backend/` o `frontend/` — todo va en `docs/` de la raíz.

- Organizar `docs/` por propósito: `architecture/` para estructura técnica, `decisions/` para ADR, `development/` para trabajo local y pruebas, `deployment/` para operación, y `domains/` para reglas funcionales.

- `docs/` se puede leer como sitio con VitePress (`npm run docs:dev`). Al agregar un documento, **sumarlo al sidebar** de `docs/.vitepress/config.mjs` y ejecutar `npm run docs:build`, que falla ante enlaces internos rotos. Los índices de carpeta se siguen llamando `README.md`; `rewrites` los sirve como `index.md`.

- Los nombres de variables, funciones y archivos se mantienen en **inglés** (convención estándar de código).

### Buenas Prácticas de Código

- **Nombres descriptivos**: variables, funciones y componentes deben tener nombres que expliquen su propósito sin necesidad de comentarios. Preferir `fetchMergeRequestApprovals` sobre `getData`.

- **Código fácil de leer**: priorizar soluciones claras y directas que otro desarrollador pueda comprender y mantener sin esfuerzo innecesario. Evitar abstracciones prematuras, estructuras rebuscadas y optimizaciones que dificulten la lectura sin aportar un beneficio comprobable.

- **Funciones pequeñas y con responsabilidad única**: si una función hace más de una cosa, separarla. Cada función debe poder describirse en una oración.

- **Comentarios solo para lógica compleja**: no comentar lo obvio. Dejar comentarios cuando hay una decisión no evidente, un workaround, una regla de negocio sutil, o un algoritmo que requiere explicación. El comentario debe explicar el **por qué**, no el **qué**.

- **JSDoc en funciones auxiliares**: documentar las funciones auxiliares con JSDoc, describiendo su propósito, parámetros, valor de retorno y errores cuando corresponda. Evitar repetir información evidente a partir de la firma.

- **Early returns**: preferir retornos tempranos para reducir anidamiento. Evitar `else` después de un `return`.

- **Manejo de errores**: siempre manejar errores en llamadas a APIs externas y operaciones async. Loguear con contexto suficiente para diagnosticar el problema.

- **No repetir código (DRY)**: si una lógica se repite en más de dos lugares, extraerla a una función utilitaria o a un hook.

- **Destructuring** cuando mejore la legibilidad, no por default en todos los casos.

### Estructura y Organización

- **Separar responsabilidades por paquete**: `backend/` contiene la API y la integración con GitLab; `frontend/` contiene la aplicación React. Los scripts que coordinan ambos paquetes y la documentación compartida viven en la raíz.

- **No crear archivos innecesarios**: preferir editar archivos existentes. Solo crear nuevos cuando la responsabilidad no encaja en ninguno existente.

- El proyecto requiere **Node.js 22 o superior y npm 10 o superior**, declarado en `engines` en los tres `package.json`. Mantener estas versiones sincronizadas entre sí y con la documentación.

### Backend

- Mantener la arquitectura por capas: las rutas HTTP van en `backend/src/routes/`, la lógica de negocio y el acceso a GitLab en `backend/src/services/`, y las utilidades reutilizables en `backend/src/utils/`.

- Mantener separado el armado de Express en `backend/src/app.ts` del arranque del servidor en `backend/src/index.ts`. Esto permite probar la aplicación en memoria e inyectar sus dependencias.

- Centralizar la lectura y validación de variables de entorno en `backend/src/config.ts`. Al agregar una variable, actualizar también `backend/.env.example` y la tabla de `docs/development/entorno-local.md`.

- Usar **TypeScript estricto y ES modules** (`import`/`export`). Escribir la extensión `.js` en imports relativos para que sean compatibles con la salida `NodeNext`.

- Las rutas deben validar sus parámetros de entrada y devolver errores HTTP apropiados (400, 404, 500 o el código específico que corresponda).

- Al agregar un endpoint, implementarlo en `backend/src/routes/` y documentarlo. Si requiere un router nuevo, montarlo desde `backend/src/app.ts`.

- Respetar el **rate limiter** existente al hacer llamadas a la API de GitLab.

### Frontend

- Organizar cada funcionalidad en `frontend/src/features/<feature>/`: los componentes van en `components/` y los hooks en `hooks/`. Reservar `frontend/src/app/` para la composición general de la aplicación.

- Usar **React 19 con componentes de función** en archivos `.jsx` ([ADR 0005](docs/decisions/0005-frontend-en-react.md)).

- **Un componente, una responsabilidad**: cada componente debe tener un propósito claro. Si crece demasiado, extraer subcomponentes dentro de la feature correspondiente.

- Estilos con **Tailwind CSS** — no usar CSS custom salvo para casos que Tailwind no cubra.

- **El estado compartido va al store** de `hooks/useMergeRequests.js`, que usa `useSyncExternalStore`. Un `useState` sirve para estado local del componente; si dos componentes deben verlo, va al store.

- **Los efectos se ejecutan dos veces en desarrollo** por `StrictMode`. Todo `useEffect` con suscripciones, timers o peticiones debe limpiar en su retorno y ser idempotente.

- Nuevos componentes reciben **props explícitas con valores por omisión** y avisan al padre con callbacks `onAlgo`. No mutar props ni estado.

- Verificar que los cambios se ven bien en el **tema oscuro** (el proyecto usa dark mode por defecto).

- Mantener el objetivo de **WCAG 2.2 nivel AA**: HTML semántico, uso completo por teclado, foco visible, nombres accesibles, estados dinámicos anunciados y contraste mínimo de 4.5:1 para texto normal y 3:1 para controles e indicadores visuales.

- No usar solamente color, posición o iconos para comunicar un estado; acompañarlos con texto accesible.

### Dependencias

- **No agregar dependencias sin justificación** — el proyecto es intencionalmente liviano.

- Antes de instalar un paquete, evaluar si se puede resolver con lo que ya hay o con código propio simple.

- Si se agrega una dependencia, documentar el motivo en el commit.

### Commits

- El mensaje completo de cada commit debe estar en **inglés**, tanto el tipo como la descripción.

- Formato: `<type>: <description>` (por ejemplo: `feat: add author filter`, `fix: correct approval calculation`).

- Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

### Antes de Entregar un Cambio

- Verificar tipos y compilación del backend (`npm run typecheck` y `npm run build` en `backend/`) y que levanta sin errores (`npm run dev`).

- Verificar que el frontend compila y renderiza correctamente (`npm run dev` en `frontend/`).

- Revisar la consola del navegador por errores o warnings.

- Si el cambio afecta la UI, verificar visualmente en el browser.

- Para cambios de UI, recorrer los controles con teclado, comprobar foco, nombres y estados accesibles, y validar contraste en tema oscuro.

### Pruebas Automatizadas

- La estrategia está documentada en `docs/development/pruebas.md`: Vitest para pruebas unitarias y de integración, React Testing Library para componentes y Playwright Test para E2E (pendiente).

- Ejecutar `npm test` en la raíz antes de entregar un cambio, además de la validación manual indicada en la guía.

- Ubicar las pruebas junto al código con sufijo `.test.ts` o `.test.js`, y las utilidades y fixtures compartidas en la carpeta `test/` del paquete. Las pruebas unitarias y de integración nunca deben usar la API real de GitLab.

- En el backend, las pruebas se excluyen del build (`tsconfig.json`) y se validan por tipos con `tsconfig.test.json`; `npm run typecheck` corre ambos.

- Mantener las reglas puras en `src/services/mergeRequestRules.ts` e inyectar dependencias (fuente de datos, reloj) en lugar de acoplarlas al módulo, para que sigan siendo testeables.

- Priorizar comportamiento observable y reglas de negocio. No acoplar pruebas a clases Tailwind, estado interno o snapshots extensos.

- Toda corrección de un defecto debe agregar una prueba de regresión que falle antes de la corrección.

- Los cambios de clasificación deben cubrir la matriz de estados y prioridades descrita en la estrategia.

- Las pruebas E2E deben usar Playwright, conectarse a la API real de GitLab mediante `GITLAB_TOKEN` y priorizar selectores accesibles. Deben ejecutarse contra proyectos de prueba configurados para este propósito y fallar con un mensaje claro cuando el token no esté disponible.

- Ejecutar inicialmente los E2E solo en Chromium; agregar Firefox o WebKit únicamente cuando exista un requisito explícito de compatibilidad.

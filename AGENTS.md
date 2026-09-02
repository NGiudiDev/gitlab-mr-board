# AGENTS.md — GitLab MR Board

## Reglas de Trabajo del Agente

### Idioma y Documentación

- **Todo en español**: comentarios, commits, documentación, nombres de columnas/estados en la UI, y mensajes de error visibles al usuario.
- Al agregar una feature nueva, **siempre actualizar la documentación** correspondiente: este archivo (`AGENTS.md`), el `README.md`, la carpeta `docs/`, y comentarios inline si aplica.
- **Toda la documentación vive en la raíz del proyecto**: `README.md`, `AGENTS.md`, y la carpeta `docs/` centralizada. No crear carpetas `docs/` dentro de `backend/` o `frontend/` — todo va en `docs/` de la raíz.
- Organizar `docs/` por propósito: `architecture/` para estructura técnica, `decisions/` para ADR, `development/` para trabajo local y pruebas, `deployment/` para operación, y `domains/` para reglas funcionales.
- El `README.md` debe ser una entrada breve que responda qué es el proyecto, requisitos, puesta en marcha, tests, build y ubicación de la documentación.
- `docs/` se puede leer como sitio con VitePress (`npm run docs:dev`). Al agregar un documento, **sumarlo al sidebar** de `docs/.vitepress/config.mjs` y ejecutar `npm run docs:build`, que falla ante enlaces internos rotos. Los índices de carpeta se siguen llamando `README.md`; `rewrites` los sirve como `index.md`.
- Los nombres de variables, funciones y archivos se mantienen en **inglés** (convención estándar de código).

### Buenas Prácticas de Código

- **Nombres descriptivos**: variables, funciones y componentes deben tener nombres que expliquen su propósito sin necesidad de comentarios. Preferir `fetchMergeRequestApprovals` sobre `getData`.
- **Funciones pequeñas y con responsabilidad única**: si una función hace más de una cosa, separarla. Cada función debe poder describirse en una oración.
- **Comentarios solo para lógica compleja**: no comentar lo obvio. Dejar comentarios cuando hay una decisión no evidente, un workaround, una regla de negocio sutil, o un algoritmo que requiere explicación. El comentario debe explicar el **por qué**, no el **qué**.
- **Early returns**: preferir retornos tempranos para reducir anidamiento. Evitar `else` después de un `return`.
- **Manejo de errores**: siempre manejar errores en llamadas a APIs externas y operaciones async. Loguear con contexto suficiente para diagnosticar el problema.
- **No repetir código (DRY)**: si una lógica se repite en más de dos lugares, extraerla a una función utilitaria o composable.
- **Destructuring** cuando mejore la legibilidad, no por default en todos los casos.

### Estructura y Organización

- **Respetar la arquitectura existente**: la lógica de negocio va en `backend/src/services/`, las rutas en `backend/src/routes/`, los componentes Vue en `frontend/src/components/`, y los composables en `frontend/src/composables/`.
- **No crear archivos innecesarios**: preferir editar archivos existentes. Solo crear nuevos cuando la responsabilidad no encaja en ninguno existente.
- **Un componente, una responsabilidad**: cada componente Vue debe tener un propósito claro. Si crece demasiado, extraer subcomponentes.
- Al agregar una nueva variable de entorno, actualizar `backend/.env.example`, `backend/src/config.ts`, y la tabla de este archivo.

### Frontend

- Usar **Composition API con `<script setup>`** en todos los componentes Vue.
- Estilos con **Tailwind CSS** — no usar CSS custom salvo para casos que Tailwind no cubra.
- Mantener la **reactividad** con `ref()` y `computed()`. No mutar estado directamente.
- Nuevos componentes deben aceptar **props tipadas** y emitir eventos con `defineEmits`.
- Verificar que los cambios se ven bien en el **tema oscuro** (el proyecto usa dark mode por defecto).
- Mantener el objetivo de **WCAG 2.2 nivel AA**: HTML semántico, uso completo por teclado, foco visible, nombres accesibles, estados dinámicos anunciados y contraste mínimo de 4.5:1 para texto normal y 3:1 para controles e indicadores visuales.
- No usar solamente color, posición o iconos para comunicar un estado; acompañarlos con texto accesible.

### Backend

- El proyecto requiere **Node.js 22 o superior y npm 10 o superior**. Mantener sincronizados los campos `engines`, el chequeo `backend/scripts/check-node-version.cjs` y la documentación cuando cambie este mínimo.
- Usar **TypeScript estricto y ES modules** (`import`/`export`). Escribir la extensión `.js` en imports relativos para que sean compatibles con la salida `NodeNext`.
- Ejecutar `npm run typecheck` y `npm run build` al modificar el backend.
- Nuevas rutas deben validar parámetros de entrada y devolver errores HTTP apropiados (400, 404, 500).
- Si se agrega un endpoint, registrarlo en `backend/src/index.ts` y documentarlo.
- Respetar el **rate limiter** existente al hacer llamadas a la API de GitLab.

### Dependencias

- **No agregar dependencias sin justificación** — el proyecto es intencionalmente liviano.
- Antes de instalar un paquete, evaluar si se puede resolver con lo que ya hay o con código propio simple.
- Si se agrega una dependencia, documentar el motivo en el commit.

### Commits

- Mensajes de commit en **inglés**, descriptivos y concisos.
- Formato: `<tipo>: <descripción>` (ej: `feat: agregar filtro por autor`, `fix: corregir cálculo de approvals`).
- Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

### Antes de Entregar un Cambio

- Verificar tipos y compilación del backend (`npm run typecheck` y `npm run build` en `backend/`) y que levanta sin errores (`npm run dev`).
- Verificar que el frontend compila y renderiza correctamente (`npm run dev` en `frontend/`).
- Revisar la consola del navegador por errores o warnings.
- Si el cambio afecta la UI, verificar visualmente en el browser.
- Para cambios de UI, recorrer los controles con teclado, comprobar foco, nombres y estados accesibles, y validar contraste en tema oscuro.

### Pruebas Automatizadas

- La estrategia está documentada en `docs/development/pruebas.md`: Vitest para pruebas unitarias y de integración, Vue Test Utils para componentes Vue y Playwright Test para E2E (pendiente).
- Ejecutar `npm test` en la raíz antes de entregar un cambio, además de la validación manual indicada en la guía.
- Ubicar las pruebas junto al código con sufijo `.test.ts` o `.test.js`, y las utilidades y fixtures compartidas en la carpeta `test/` del paquete. Nunca usar la API real de GitLab.
- En el backend, las pruebas se excluyen del build (`tsconfig.json`) y se validan por tipos con `tsconfig.test.json`; `npm run typecheck` corre ambos.
- Mantener las reglas puras en `src/services/mergeRequestRules.ts` e inyectar dependencias (fuente de datos, reloj) en lugar de acoplarlas al módulo, para que sigan siendo testeables.
- Priorizar comportamiento observable y reglas de negocio. No acoplar pruebas a clases Tailwind, estado interno o snapshots extensos.
- Toda corrección de un defecto debe agregar una prueba de regresión que falle antes de la corrección.
- Los cambios de clasificación deben cubrir la matriz de estados y prioridades descrita en la estrategia.
- Las pruebas E2E deben usar Playwright, simular la API de GitLab con fixtures locales y priorizar selectores accesibles. No deben depender de un token ni de servicios externos.
- Ejecutar inicialmente los E2E solo en Chromium; agregar Firefox o WebKit únicamente cuando exista un requisito explícito de compatibilidad.

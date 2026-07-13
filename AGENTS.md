# AGENTS.md — GitLab MR Board

## Reglas de Trabajo del Agente

### Idioma y Documentación

- **Todo en español**: comentarios, commits, documentación, nombres de columnas/estados en la UI, y mensajes de error visibles al usuario.
- Al agregar una feature nueva, **siempre actualizar la documentación** correspondiente: este archivo (`AGENTS.md`), el `README.md`, la carpeta `docs/`, y comentarios inline si aplica.
- **Toda la documentación vive en la raíz del proyecto**: `README.md`, `AGENTS.md`, y la carpeta `docs/` centralizada. No crear carpetas `docs/` dentro de `backend/` o `frontend/` — todo va en `docs/` de la raíz.
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
- Al agregar una nueva variable de entorno, actualizar `backend/.env.example`, `backend/src/config.js`, y la tabla de este archivo.

### Frontend

- Usar **Composition API con `<script setup>`** en todos los componentes Vue.
- Estilos con **Tailwind CSS** — no usar CSS custom salvo para casos que Tailwind no cubra.
- Mantener la **reactividad** con `ref()` y `computed()`. No mutar estado directamente.
- Nuevos componentes deben aceptar **props tipadas** y emitir eventos con `defineEmits`.
- Verificar que los cambios se ven bien en el **tema oscuro** (el proyecto usa dark mode por defecto).

### Backend

- Usar **CommonJS** (`require`/`module.exports`) — no migrar a ESM.
- Nuevas rutas deben validar parámetros de entrada y devolver errores HTTP apropiados (400, 404, 500).
- Si se agrega un endpoint, registrarlo en `backend/src/index.js` y documentarlo.
- Respetar el **rate limiter** existente al hacer llamadas a la API de GitLab.

### Dependencias

- **No agregar dependencias sin justificación** — el proyecto es intencionalmente liviano.
- Antes de instalar un paquete, evaluar si se puede resolver con lo que ya hay o con código propio simple.
- Si se agrega una dependencia, documentar el motivo en el commit.

### Commits

- Mensajes de commit en **español**, descriptivos y concisos.
- Formato: `<tipo>: <descripción>` (ej: `feat: agregar filtro por autor`, `fix: corregir cálculo de approvals`).
- Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`.

### Antes de Entregar un Cambio

- Verificar que el backend levanta sin errores (`npm run dev` en `backend/`).
- Verificar que el frontend compila y renderiza correctamente (`npm run dev` en `frontend/`).
- Revisar la consola del navegador por errores o warnings.
- Si el cambio afecta la UI, verificar visualmente en el browser.

# Arquitectura del frontend

Aplicación Vue 3 con Composition API, Vite y Tailwind CSS.

- `src/main.js`: arranque de Vue.
- `src/app/App.vue`: composición y estados de carga, error y vacío.
- `src/features/mergeRequests/composables/useMergeRequests.js`: consulta, polling y filtrado.
- `src/features/mergeRequests/components/`: tablero, columnas, tarjetas e indicadores.
- `src/assets/main.css`: estilos globales.

`App.vue` consume el composable y conecta componentes presentacionales. Los datos se actualizan cada cinco minutos y manualmente. En desarrollo, Vite redirige `/api` y `/health` a `http://localhost:3001`; en producción puede definirse `VITE_API_BASE_URL`.

## Accesibilidad

La interfaz apunta a WCAG 2.2 nivel AA. `App.vue` define el contenido principal, el enlace de salto y la región viva para resultados de actualización. Los proyectos son secciones desplegables que exponen `aria-expanded` y `aria-controls`; las columnas usan encabezados y listas semánticas. Los controles tienen nombres accesibles y foco visible, y los enlaces que abren otra pestaña lo informan a tecnologías de asistencia.

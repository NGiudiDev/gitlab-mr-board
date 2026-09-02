# Arquitectura del frontend

Aplicación React 19 con Vite y Tailwind CSS ([ADR 0005](../decisions/0005-frontend-en-react.md)).

- `src/main.jsx`: arranque de React con `createRoot` y `StrictMode`.
- `src/app/App.jsx`: composición y estados de carga, error y vacío.
- `src/features/mergeRequests/hooks/useMergeRequests.js`: store compartido, consulta y polling.
- `src/features/mergeRequests/components/`: tablero, columnas, tarjetas e indicadores.
- `src/assets/main.css`: estilos globales.

`App.jsx` consume el hook y conecta componentes presentacionales. Los datos se actualizan cada cinco minutos y manualmente. En desarrollo, Vite redirige `/api` a `http://localhost:3001`; en producción puede definirse `VITE_API_BASE_URL`.

## Estado compartido

`useMergeRequests.js` mantiene el estado en variables de módulo y lo expone a React con `useSyncExternalStore`. No hay provider ni librería de estado: el store es la fuente de verdad y cualquier componente que use el hook ve la misma instancia.

Tres detalles que hay que respetar al tocar este archivo:

- **El polling pertenece al store, no al componente.** Un contador de consumidores lo arranca con el primero que monta y lo detiene con el último que desmonta.
- **La carga inicial está protegida por una guarda de petición en curso**, para que el doble montaje de `StrictMode` en desarrollo no dispare dos consultas.
- **Todo estado que deba compartirse va al store.** Un `useState` en un componente queda aislado y se desincroniza del resto.

## Accesibilidad

La interfaz apunta a WCAG 2.2 nivel AA. `App.jsx` define el contenido principal, el enlace de salto y la región viva para resultados de actualización. Los proyectos son secciones desplegables que exponen `aria-expanded` y `aria-controls`; el panel se mantiene en el DOM aunque esté contraído para que `aria-controls` apunte a un elemento existente. Las columnas usan encabezados y listas semánticas. Los controles tienen nombres accesibles y foco visible, y los enlaces que abren otra pestaña lo informan a tecnologías de asistencia.

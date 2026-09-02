# ADR 0005: migrar el frontend de Vue a React

- Estado: aceptada
- Fecha: 2026-09-02

## Contexto

El tablero se escribió en Vue 3 con Composition API. El equipo trabaja en React, así que mantener el frontend en Vue obligaba a cambiar de idioma para tocar la única parte visible del producto. La aplicación es chica —ocho componentes y un composable, unas 520 líneas— y el backend expone un contrato HTTP estable, así que el costo de cambiar de librería estaba acotado y no arrastraba al resto del sistema.

Esta decisión reemplaza la elección implícita de Vue que menciona el [ADR 0001](0001-backend-for-frontend.md) y ajusta las herramientas de componentes del [ADR 0003](0003-estrategia-de-pruebas.md); ambos siguen vigentes en todo lo demás.

## Decisión

Reescribir el frontend en **React 19** con Vite, y reemplazar **Vue Test Utils** por **React Testing Library** con `user-event`.

Lo que no cambió:

- El backend, su contrato y sus pruebas. El frontend sigue consumiendo `GET /api/pull-requests`.
- Tailwind CSS, los tokens de color y `main.css`, que pasaron textuales.
- Vitest, `happy-dom`, la estructura de carpetas por feature y los fixtures compartidos.
- El comportamiento observable: mismas columnas, misma clasificación, mismos textos y la misma estructura accesible.

Decisiones propias de la migración:

- El estado compartido usa **`useSyncExternalStore`** sobre el mismo estado a nivel de módulo que tenía el composable. React no ofrece un equivalente a un `ref` compartido entre componentes, y esta opción replica la semántica sin provider ni librería de estado.
- El polling se gobierna con un **contador de consumidores**: arranca con el primero y se detiene con el último, en lugar de atarse al ciclo de vida de un componente.
- La carga inicial está protegida por una **guarda de petición en curso**, para que el doble montaje de `StrictMode` en desarrollo no dispare dos consultas.
- El panel de cada proyecto se mantiene en el DOM cuando está contraído, como hacía `v-show`: `aria-controls` debe apuntar a un elemento existente.
- Los iconos de `BlockerBadge` pasaron de entidades inyectadas con `v-html` a caracteres literales, evitando `dangerouslySetInnerHTML`.
- Las pruebas que verificaban eventos emitidos o props de componentes hijos se reescribieron contra el DOM renderizado, en línea con la prioridad de comportamiento observable del [ADR 0003](0003-estrategia-de-pruebas.md).

`@vitejs/plugin-react` quedó fijado en la versión 4: la 6 exige Vite 8 y el proyecto usa Vite 6.

## Consecuencias

El frontend queda en la librería que el equipo usa a diario, y las pruebas de componentes verifican DOM en lugar de contratos internos. El costo es un cambio de idioma completo en la capa de vista: quien conozca la versión Vue no reconoce los archivos, y el historial de esos archivos se corta. El bundle de producción pasó a 207 kB (65 kB gzip), mayor que el de Vue por el peso de React y su DOM.

Aparecen dos trampas que Vue no tenía y que hay que respetar al agregar código: los efectos se ejecutan dos veces en desarrollo por `StrictMode`, y todo estado compartido nuevo debe pasar por el store en vez de por `useState`, o dejará de estar sincronizado entre componentes. La capa E2E con Playwright sigue pendiente y ahora debe escribirse contra la aplicación React.

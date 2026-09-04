# ADR 0005: migrar el frontend de Vue a React

- Estado: aceptada
- Fecha: 2026-09-02

## Contexto

El tablero se escribió en Vue 3 con Composition API. El equipo trabaja en React, así que mantener el frontend en Vue obligaba a cambiar de idioma para tocar la única parte visible del producto. La aplicación es chica —ocho componentes y un composable, unas 520 líneas— y el backend expone un contrato HTTP estable, así que el costo de cambiar de librería estaba acotado y no arrastraba al resto del sistema.

Esta decisión reemplaza la elección implícita de Vue que menciona el [ADR 0001](0001-backend-for-frontend.md) y ajusta las herramientas de componentes del [ADR 0003](0003-estrategia-de-test.md); ambos siguen vigentes en todo lo demás.

## Decisión

Reescribir el frontend en **React 19** con Vite, y reemplazar **Vue Test Utils** por **React Testing Library** con `user-event`.

Mantener el contrato del backend y el comportamiento observable del tablero. Usar `useSyncExternalStore` para conectar el estado compartido a React sin incorporar un provider ni otra dependencia.

La estructura resultante y los mecanismos de polling, carga y accesibilidad se documentan en la [arquitectura del frontend](../architecture/frontend.md). Los test siguen la estrategia del [ADR 0003](0003-estrategia-de-test.md).

## Consecuencias

El frontend queda en la librería que el equipo usa a diario y los test verifican el DOM en lugar de contratos internos entre componentes. El costo es perder continuidad directa con los archivos de la implementación anterior y asumir las particularidades de los efectos y el estado compartido de React.

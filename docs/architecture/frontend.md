# Arquitectura del frontend

El frontend es una aplicación de página única construida con React 19, Vite y Tailwind CSS, según el [ADR 0005](../decisions/0005-frontend-en-react.md). Consume exclusivamente el contrato consolidado del backend; no accede directamente a GitLab ni conoce su token.

La aplicación usa componentes de función en archivos `.jsx`, módulos ES y estado compartido basado en las primitivas nativas de React. No incorpora un router, un provider global ni una biblioteca externa de gestión de estado.

## Organización del código

El código se divide entre la composición general y las funcionalidades del dominio:

- `src/main.jsx`: carga los estilos globales y monta React mediante `createRoot` y `StrictMode`.
- `src/config.js`: centraliza y valida la configuración expuesta por Vite.
- `src/app/App.jsx`: compone la pantalla, conecta el store con la interfaz y decide qué mostrar durante la carga, los errores y la ausencia de datos.
- `src/features/mergeRequests/hooks/useMergeRequests.js`: contiene el store compartido, el acceso al backend y el polling.
- `src/features/mergeRequests/components/`: contiene los componentes del tablero de merge requests.
- `src/assets/main.css`: incluye las directivas de Tailwind y los pocos estilos globales que no se expresan mediante utilidades.
- `test/`: reúne la configuración, los fixtures y las utilidades compartidas según la [estrategia de pruebas](../development/pruebas.md).

Las funcionalidades nuevas deben seguir la estructura `src/features/<feature>/components/` y `src/features/<feature>/hooks/`. `src/app/` se reserva para la composición de alto nivel y no debe absorber lógica propia de una feature.

## Composición de componentes

`App` consume `useMergeRequests()` y distribuye datos y callbacks mediante props explícitas. El árbol principal es:

```text
App
├── TopBar
└── MrBoard
    └── BoardColumn
        └── MrCard
            └── BlockerBadge
```

- `TopBar` presenta los totales, el estado de sincronización y la actualización manual.
- `MrBoard` agrupa los merge requests por proyecto, mantiene el estado local de expansión y los distribuye según su clasificación.
- `BoardColumn` representa una categoría mediante una lista semántica con scroll vertical.
- `MrCard` resume el merge request, determina el responsable visible y enlaza a GitLab.
- `BlockerBadge` presenta pipeline, discusiones, aprobaciones y conflictos con texto, icono y estilo semántico.
- `FilterChips` implementa controles accesibles para seleccionar proyectos, pero actualmente no forma parte del árbol renderizado por `App`.

Los componentes presentacionales reciben valores mediante props y notifican acciones mediante callbacks como `onRefresh` u `onToggle`. No mutan las props ni el estado recibido.

## Estado compartido

`useMergeRequests.js` mantiene un store a nivel de módulo y lo conecta a React mediante `useSyncExternalStore`. El store es la única fuente de verdad para los datos remotos y contiene:

- `mergeRequests`: resultados consolidados por el backend.
- `meta`: fecha y totales de la consulta.
- `loading`: indica que existe una actualización en curso.
- `error`: conserva el último error de la consulta.
- `lastFetched`: fecha local de la última respuesta satisfactoria.

No hay un provider: todos los consumidores del hook se suscriben a la misma instancia. El estado que deba observar más de un componente debe incorporarse al store; `useState` se reserva para estado local de interfaz, como las secciones expandidas de `MrBoard`.

### Ciclo de suscripción y polling

El primer consumidor que monta el hook inicia una carga y un intervalo de actualización de cinco minutos. Un contador registra cuántos consumidores siguen activos; el intervalo se detiene cuando desmonta el último.

React ejecuta los efectos dos veces durante el montaje de desarrollo por `StrictMode`. La promesa `initialLoad` actúa como guarda para evitar que ese ciclo dispare dos cargas iniciales simultáneas. Todo cambio en las suscripciones, temporizadores o peticiones debe conservar este comportamiento idempotente y limpiar sus recursos al desmontar.

## Acceso al backend

`fetchMergeRequests()` solicita `GET /api/pull-requests` sobre la URL base validada por `src/config.js`. `VITE_API_BASE_URL` debe ser una URL HTTP(S), se normaliza sin barra final y usa `http://localhost:3001` cuando no está definida. La lista de variables y su configuración se mantiene en la [guía de entorno local](../development/entorno-local.md).

La actualización manual invoca `fetchMergeRequests(true)` y agrega `?force=true` para omitir la caché del backend. El polling usa la consulta normal y permite reutilizarla.

Antes de cada solicitud se activa `loading` y se limpia el error anterior. Una respuesta correcta reemplaza los datos, actualiza los metadatos y registra `lastFetched`. Una respuesta HTTP fallida intenta obtener el mensaje JSON del backend y, si no está disponible, usa el código de estado.

Los datos anteriores no se eliminan al fallar una actualización. Si nunca hubo una carga exitosa, `App` presenta un error bloqueante; si ya existen resultados, mantiene el tablero visible y comunica el error desde la barra de estado.

## Estados de la interfaz

`App` contempla explícitamente los siguientes estados:

- **Carga inicial**: muestra un indicador mientras no existen datos.
- **Sin resultados**: informa que no hay merge requests abiertos.
- **Error sin datos**: presenta una alerta con el detalle recibido.
- **Datos disponibles**: muestra el tablero y la hora de la última actualización.
- **Actualización en segundo plano**: conserva el contenido y anuncia el progreso.

Una región viva con `aria-live="polite"` comunica el inicio, el error y la finalización de cada actualización sin mover el foco.

## Presentación y diseño visual

Tailwind concentra los estilos de los componentes. Los colores, superficies, tipografías y estados semánticos se definen como tokens en `tailwind.config.js`; su uso se detalla en la [arquitectura de la interfaz visual](interfaz-visual.md).

`src/assets/main.css` se limita a las capas de Tailwind, el modelo de caja global, el comportamiento general de enlaces, la reducción de movimiento y la apariencia de las barras de desplazamiento. No se debe agregar CSS personalizado cuando una utilidad o un token existente pueda expresar el mismo resultado.

El tablero usa secciones verticales por proyecto. Cada sección despliega seis columnas horizontales en un contenedor desplazable y cada columna limita su altura para desplazar las tarjetas verticalmente.

## Accesibilidad

La interfaz apunta a WCAG 2.2 nivel AA y aplica estas decisiones:

- `App` incluye un enlace para saltar al contenido principal.
- Los estados de carga, vacío y error usan roles semánticos.
- Los cambios asíncronos se anuncian mediante una región viva.
- Los proyectos son secciones desplegables con `aria-expanded` y `aria-controls`.
- El panel de cada proyecto permanece en el DOM cuando está contraído para que la referencia de `aria-controls` siga siendo válida.
- Las columnas usan encabezados y listas semánticas.
- Los botones y enlaces tienen nombres accesibles y foco visible.
- Los enlaces externos informan que abren una pestaña nueva y usan `rel="noopener"`.
- Los badges combinan texto, iconos y color; ningún estado depende solo del color.
- Las animaciones y transiciones se reducen cuando el sistema indica `prefers-reduced-motion`.

La validación automatizada y manual de estos comportamientos se define en la [estrategia de pruebas](../development/pruebas.md).

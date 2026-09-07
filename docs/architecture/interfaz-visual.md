# Interfaz visual

El tablero usa tema oscuro y Tailwind CSS. Los tokens extendidos se definen en `frontend/tailwind.config.js`; los estilos globales viven en `frontend/src/assets/main.css`.

## Layout

El layout es deliberadamente mínimo: una barra superior fija con el nombre del tablero, la navegación entre secciones y la sesión, y debajo el contenido a todo el ancho disponible hasta `1600px`. La barra usa el mismo fondo de página con un borde inferior, sin superficie propia, para que el tablero domine la pantalla.

El tablero reúne en una sola fila los controles de la vista —a la izquierda— y el resumen, el estado de sincronización y la actualización manual —a la derecha—, separados del contenido por un borde suave. El orden del DOM coincide con el visual, así que el recorrido por teclado sigue la lectura.

## Colores semánticos

| Concepto | Token principal | Uso |
|---|---|---|
| Fondo | `bg` | Página |
| Superficie | `surface` | Paneles y columnas |
| Acento | `accent` | Acciones y foco |
| Borde de control | `control` | Límite perceptible de inputs y botones |
| Listo | `ready` | Estado correcto |
| Pendiente | `draft` | Trabajo en curso |
| Bloqueado | `conflict` | Error o conflicto |

Las tarjetas muestran badges de pipeline, discusiones, aprobaciones y conflictos, más el título, las ramas, los responsables y el autor. Las secciones se agrupan por repositorio y pueden colapsarse.

Todo cambio visual debe revisarse en tema oscuro, con scroll horizontal y vertical, y en los estados de carga, error y vacío.

Los tokens de texto normal mantienen al menos 4.5:1 respecto de las superficies donde se usan. El token `control` mantiene al menos 3:1 para límites de componentes interactivos. La información semántica nunca depende únicamente del color y las animaciones se reducen cuando el sistema informa `prefers-reduced-motion`.

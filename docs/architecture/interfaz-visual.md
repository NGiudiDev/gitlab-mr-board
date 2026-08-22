# Interfaz visual

El tablero usa tema oscuro y Tailwind CSS. Los tokens extendidos se definen en `frontend/tailwind.config.js`; los estilos globales viven en `frontend/src/assets/main.css`.

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

Las tarjetas muestran indicadores para pipeline, discusiones y aprobaciones, además de badges de conflicto, draft y hasta cuatro etiquetas. Las secciones se agrupan por repositorio y pueden colapsarse.

Todo cambio visual debe revisarse en tema oscuro, con scroll horizontal y vertical, y en los estados de carga, error y vacío.

Los tokens de texto normal mantienen al menos 4.5:1 respecto de las superficies donde se usan. El token `control` mantiene al menos 3:1 para límites de componentes interactivos. La información semántica nunca depende únicamente del color y las animaciones se reducen cuando el sistema informa `prefers-reduced-motion`.

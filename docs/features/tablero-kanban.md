# Tablero Kanban

Vista principal de la aplicacion. Muestra todos los Merge Requests abiertos organizados en columnas segun su estado de mergeabilidad.

## Columnas

El tablero tiene 6 columnas, una por cada estado posible:

| Columna | Estado | Color del borde |
|---|---|---|
| Draft | `gray` | Gris |
| Pendientes | `yellow` | Amarillo |
| Code Review | `review` | Azul |
| QA | `qa` | Púrpura |
| Listas para mergear | `green` | Verde |
| Despriorizado | `backlog` | Atenuado |

## Agrupacion por repositorio

Los MRs se agrupan por proyecto/repositorio. Cada repositorio tiene su propia seccion colapsable con las 6 columnas. Esto permite ver rapidamente el estado de cada repo sin mezclar MRs de distintos proyectos.

## Componentes involucrados

- `MrBoard.vue` — Agrupa MRs por proyecto y renderiza secciones colapsables.
- `BoardColumn.vue` — Columna individual con titulo, contador de MRs y lista scrolleable de cards.
- `MrCard.vue` — Card individual de cada MR con toda su informacion.

## Comportamiento

- Cada columna tiene ancho fijo de 250px y scroll vertical independiente.
- Las secciones de repositorio se pueden colapsar/expandir.
- Las cards muestran: titulo (con link a GitLab), branch origen/destino, badges de bloqueo, persona responsable, autor, tiempo relativo desde la ultima actualizacion, y hasta 4 labels.

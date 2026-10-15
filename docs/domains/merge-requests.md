# Merge Requests

El backend consulta los proyectos configurados por la cuenta y enriquece cada merge request abierto con aprobaciones, discusiones, pipeline, conflictos, autor y reviewers. Luego aplica las reglas de este dominio antes de responder al frontend.

## Clasificación

Se usa la primera condición coincidente:

| Prioridad | Clasificación | Columna | Condición |
|---:|---|---|---|
| 1 | `backlog` | Pausados | Tiene la etiqueta `backlog`. |
| 2 | `in_progress` | En progreso | Es draft o WIP. |
| 3 | `mr_warning` | Pendientes | Tiene conflictos, discusiones pendientes o pipeline fallido, cancelado, ejecutándose o pendiente. |
| 4 | `ready_to_merge` | Listas para mergear | Tiene la etiqueta `qa_approved`. |
| 5 | `review` | Code Review | Faltan aprobaciones requeridas. |
| 6 | `qa` | QA | Tiene `qa_pending` y no coincidió con una regla anterior. |
| 7 | `unknown` | Estado desconocido | No coincide con ninguna condición. |

El frontend define el orden visible de las columnas, pero usa esta clasificación sin recalcularla.

## Responsable

El backend publica en `responsiblePeople` las personas con una acción pendiente:

- En `in_progress`, `mr_warning`, `qa` y `ready_to_merge`, el responsable es el autor.
- En `review`, son responsables los reviewers asignados que todavía no aprobaron.
- Si todos los reviewers aprobaron, la responsabilidad vuelve al autor.
- Sin reviewers, o en `backlog` y `unknown`, no hay responsables.

La comparación usa `username` sin distinguir mayúsculas; el nombre visible nunca identifica a una persona. `meta.people` reúne autores y reviewers sin duplicados para la [vista personal](vista-personal.md).

## Fecha de subida

Un MR `ready_to_merge` puede tener una fecha de subida opcional en formato `AAAA-MM-DD`. No proviene de GitLab: es un dato del tablero compartido por toda la cuenta.

El backend la persiste por cuenta, proyecto e IID y la publica como `uploadDate`. Antes de crearla, modificarla o quitarla, vuelve a comprobar que el MR pertenezca al tablero y siga listo para mergear.

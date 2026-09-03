# Dominio de Merge Requests

El sistema consulta los MRs abiertos de `PROJECT_IDS` y agrega aprobaciones, discusiones pendientes, último pipeline, conflictos, draft, etiquetas, autor y reviewers.

## Clasificación

Se aplica la primera regla coincidente:

1. `backlog`: tiene la etiqueta `backlog`.
2. `in_progress`: es draft o WIP.
3. `mr_warning`: tiene conflictos, discusiones pendientes o un pipeline fallido, cancelado, ejecutándose o pendiente.
4. `ready_to_merge`: tiene `qa_approved`.
5. `review`: faltan aprobaciones o la del líder.
6. `qa`: tiene `qa_pending` y no presenta bloqueos técnicos ni aprobaciones pendientes.
7. `unknown`: no coincide con ninguna condición anterior.

El frontend muestra En progreso, Pendientes, Code Review, QA, Listas para mergear y Pausados, agrupadas por proyecto. Los MRs con clasificación `unknown` no se muestran en ninguna columna.

## Responsable mostrado

En En progreso, Pendientes, QA y Listas para mergear se muestra el autor como responsable. En Code Review se muestran los reviewers asignados; si no existen, no se presenta responsable. En Pausados no se muestra responsable.

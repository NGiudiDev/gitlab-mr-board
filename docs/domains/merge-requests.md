# Dominio de Merge Requests

El sistema consulta los MRs abiertos de `PROJECT_IDS` y agrega aprobaciones, discusiones pendientes, último pipeline, conflictos, autor y reviewers. Las etiquetas y el estado draft se leen de GitLab para clasificar, pero no forman parte del contrato: el tablero no los muestra.

## Clasificación

Se aplica la primera regla coincidente:

1. `backlog`: tiene la etiqueta `backlog`.
2. `in_progress`: es draft o WIP.
3. `mr_warning`: tiene conflictos, discusiones pendientes o un pipeline fallido, cancelado, ejecutándose o pendiente.
4. `ready_to_merge`: tiene `qa_approved`.
5. `review`: faltan aprobaciones o la del líder.
6. `qa`: tiene `qa_pending` y no presenta bloqueos técnicos ni aprobaciones pendientes.
7. `unknown`: no coincide con ninguna condición anterior.

## Columnas del tablero

El frontend define las columnas visibles y su orden en `mergeRequestColumns.js`: En progreso, Pendientes, Code Review, QA, Listas para mergear y Pausados. Agrupa por proyecto y reparte cada MR en la columna de su clasificación. Los MRs con clasificación `unknown` no tienen columna, así que no se muestran.

## Responsable

El backend calcula los responsables de cada merge request y los publica en `responsiblePeople`, una lista de identidades con `name` y `username`. El frontend no reimplementa la regla: presenta esa lista en la tarjeta y la usa para filtrar la [vista personal](vista-personal.md).

En En progreso, Pendientes, QA y Listas para mergear el responsable es el autor. En Code Review son responsables únicamente los reviewers asignados que todavía no aprobaron; cuando todos los reviewers ya aprobaron, la responsabilidad vuelve al autor. Si no hay reviewers asignados, el MR no tiene responsable. En Pausados y en `unknown` tampoco hay responsable.

La comparación entre reviewers y aprobadores se hace por `username` sin distinguir mayúsculas de minúsculas. Un nombre visible nunca se usa para decidir si dos personas son la misma.

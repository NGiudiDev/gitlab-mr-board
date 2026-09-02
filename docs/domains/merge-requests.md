# Dominio de Merge Requests

El sistema consulta los MRs abiertos de `PROJECT_IDS` y agrega aprobaciones, discusiones pendientes, último pipeline, conflictos, draft, etiquetas, autor y reviewers.

## Clasificación

Se aplica la primera regla coincidente:

1. `backlog`: tiene la etiqueta `backlog`.
2. `in_progress`: es draft o WIP.
3. `qa`: tiene `qa_pending`.
4. `mr_warning`: tiene conflictos, discusiones pendientes o un pipeline fallido, cancelado, ejecutándose o pendiente.
5. `review`: faltan aprobaciones o la del líder.
6. `mr_warning`: falta `qa_approved`.
7. `ready_to_merge`: no queda ningún bloqueo.

El frontend muestra En progreso, Pendientes, Code Review, QA, Listas para mergear y Pausados, agrupadas por proyecto. Hay polling cada cinco minutos; la actualización manual omite la caché de un minuto del backend.

## Responsable mostrado

En draft, bloqueos, pendientes, lista y backlog se muestra el autor como responsable. En Code Review se muestran los reviewers asignados. En QA, la responsabilidad depende del contexto del equipo.

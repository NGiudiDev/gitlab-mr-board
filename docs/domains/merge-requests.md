# Dominio de Merge Requests

El sistema consulta los MRs abiertos de `PROJECT_IDS` y agrega aprobaciones, discusiones pendientes, último pipeline, conflictos, draft, etiquetas, autor y reviewers.

## Clasificación

Se aplica la primera regla coincidente:

1. `backlog`: tiene la etiqueta `backlog`.
2. `gray`: es draft o WIP.
3. `qa`: tiene `qa_pending`.
4. `yellow`: tiene conflictos, pipeline fallido/cancelado o discusiones pendientes.
5. `yellow`: el pipeline está ejecutándose o pendiente.
6. `review`: faltan aprobaciones o la del líder.
7. `yellow`: falta `qa_approved`.
8. `green`: no queda ningún bloqueo.

El frontend muestra Draft, Pendientes, Code Review, QA, Listas para mergear y Despriorizado, agrupadas por proyecto. La búsqueda local considera título, autor, ramas y ruta. Hay polling cada cinco minutos; la actualización manual omite la caché de un minuto del backend.

## Responsable mostrado

En draft, bloqueos, pendientes, lista y backlog se muestra el autor como responsable. En Code Review se muestran los reviewers asignados. En QA, la responsabilidad depende del contexto del equipo.

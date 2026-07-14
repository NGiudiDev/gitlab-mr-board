# Responsable dinamico

Muestra quien es la persona responsable de actuar sobre cada Merge Request segun su estado actual.

## Logica

La persona responsable cambia dinamicamente segun el estado de mergeabilidad del MR:

| Estado | Responsable | Razon |
|---|---|---|
| `gray` (Draft) | Autor del MR | El autor debe terminar el MR y sacarlo de draft |
| `red` (Bloqueada) | Autor del MR | El autor debe resolver los bloqueantes |
| `attention` (Requiere atencion) | Autor del MR | El autor debe atender los bloqueantes pendientes |
| `green` (Lista) | Autor del MR | El autor debe hacer el merge |
| `review` (Code Review) | Reviewers asignados | Los reviewers deben revisar y aprobar |
| `yellow` (Pendiente) | Depende del contexto | Puede ser el autor o el equipo de QA |
| `backlog` (Despriorizado) | Autor del MR | Baja prioridad, el autor decide cuando retomar |

## Datos mostrados

- **Avatar** — Imagen del usuario responsable.
- **Nombre** — Nombre del usuario.
- Para MRs en code review, se muestran los reviewers asignados en lugar del autor.

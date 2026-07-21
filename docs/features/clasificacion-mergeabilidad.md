# Clasificacion de mergeabilidad

Logica central del sistema que determina en que columna del tablero se ubica cada Merge Request.

## Estados

Cada MR se clasifica en uno de 6 estados, evaluados en este orden de prioridad:

| Prioridad | Estado | Condicion |
|---|---|---|
| 1 | `backlog` | Tiene el label "backlog" |
| 2 | `gray` | Es draft o WIP |
| 3 | `yellow` | Tiene bloqueantes: conflictos de merge, pipeline fallido/cancelado, o threads sin resolver |
| 4 | `review` | No tiene suficientes aprobaciones o falta la aprobacion del team lead |
| 5 | `qa` | Tiene el label "qa_pending" (pendiente de QA) |
| 6 | `yellow` | Pipeline corriendo/pendiente, o falta el label "qa_approved" |
| 7 | `green` | Todo ok: sin bloqueantes, aprobado, pipeline pasado, QA aprobado |

## Datos utilizados

Para clasificar cada MR, el backend hace 3 llamadas adicionales a la API de GitLab (en paralelo):

1. **Approvals** — Estado de aprobaciones, cantidad dada vs requerida, si el team lead aprobo.
2. **Discussions** — Cantidad de threads de discusion sin resolver.
3. **Pipeline** — Estado del ultimo pipeline (success, failed, running, pending, canceled).

## Configuracion

- `TEAM_LEAD_USERNAME` — Usuario del team lead cuya aprobacion se trackea por separado.
- `MIN_APPROVALS` — Cantidad minima de aprobaciones requeridas.

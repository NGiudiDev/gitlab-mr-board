# Blocker badges

Indicadores visuales que muestran el estado de los tres posibles bloqueantes de cada Merge Request.

## Tipos de badges

Cada MR card muestra hasta 3 badges:

### 1. Pipeline (CI)

Muestra el estado del ultimo pipeline del MR.

| Estado | Visual |
|---|---|
| `success` | Badge verde "CI OK" |
| `failed` / `canceled` | Badge rojo "CI Failed" |
| `running` / `pending` | Badge amarillo "CI Running" |
| Sin pipeline | Badge gris "Sin CI" |

El badge de pipeline es clickeable y lleva a la URL del pipeline en GitLab.

### 2. Threads (discusiones)

Muestra la cantidad de threads de discusion sin resolver.

| Estado | Visual |
|---|---|
| 0 threads | Badge verde "0 threads" |
| 1+ threads | Badge rojo con la cantidad |

### 3. Approvals (aprobaciones)

Muestra el progreso de aprobaciones.

| Estado | Visual |
|---|---|
| Suficientes aprobaciones | Badge verde "N/M approvals" |
| Faltan aprobaciones | Badge rojo/amarillo con el conteo |

Incluye informacion sobre si el team lead aprobo o no, visible en el tooltip.

## Badges adicionales en la card

- **"Conflicto"** — Badge rojo que aparece cuando el MR tiene conflictos de merge.
- **"Draft"** — Badge gris que aparece cuando el MR es un borrador.
- **Labels** — Se muestran hasta 4 labels de GitLab en cada card.

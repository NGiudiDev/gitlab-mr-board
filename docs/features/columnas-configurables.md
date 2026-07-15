# Columnas configurables

Permitir definir las columnas del tablero y las reglas de clasificacion desde el frontend, con persistencia en un archivo JSON en el backend.

**Estado**: Por desarrollar

## Objetivo

Actualmente las 7 columnas y la logica de clasificacion (`computeMergeability`) estan definidas directamente en el codigo del backend. Esta feature permite que un usuario configure desde la UI:

- Que columnas existen en el tablero.
- En que orden se muestran.
- Que condiciones debe cumplir un MR para caer en cada columna.
- Color y nombre de cada columna.

## Arquitectura

```
Frontend (UI de config)  -->  Backend (API REST)  -->  columns.json (persistencia)
```

1. El frontend expone una pantalla de configuracion para editar columnas y reglas.
2. Los cambios se envian al backend via API.
3. El backend persiste la configuracion en un archivo `columns.json`.
4. Al clasificar MRs, el backend lee las reglas desde ese archivo.

## API del backend

### `GET /api/columns`

Devuelve la configuracion actual de columnas.

**Response:**

```json
{
  "columns": [ ... ]
}
```

### `PUT /api/columns`

Recibe la configuracion completa de columnas y la persiste en `columns.json`.

**Request body:**

```json
{
  "columns": [ ... ]
}
```

**Validaciones:**
- Al menos una columna debe existir.
- Cada columna debe tener `id`, `name`, `color` y `rules`.
- Los `id` deben ser unicos.
- Los campos referenciados en las condiciones deben ser validos.
- Debe existir exactamente una columna con `"default": true`.

**Response exito:** `200 OK` con la configuracion guardada.
**Response error:** `400 Bad Request` con detalle de la validacion fallida.

## UI de configuracion (frontend)

### Acceso

Boton de configuracion (icono engranaje) en el `TopBar` que abre un panel/modal de configuracion de columnas.

### Funcionalidades

- **Lista de columnas** — Vista ordenable (drag & drop) de todas las columnas configuradas.
- **Agregar columna** — Boton para crear una nueva columna con nombre, color e ID.
- **Editar columna** — Click en una columna para modificar nombre, color y reglas.
- **Eliminar columna** — Boton para remover una columna (con confirmacion).
- **Reordenar** — Drag & drop para cambiar el orden de evaluacion.
- **Editor de reglas** — Interfaz visual para armar condiciones sin escribir JSON:
  - Selector de campo (dropdown con los campos disponibles).
  - Selector de operador (filtrado segun el tipo de campo).
  - Input de valor (adaptado al tipo: toggle para boolean, number input para numeros, text para strings, multi-select para arrays).
  - Selector de operador logico (AND/OR) para combinar condiciones.
  - Boton para agregar/remover condiciones.
  - Soporte para grupos anidados de condiciones.
- **Columna default** — Toggle para marcar una columna como la default (captura MRs que no matchean ninguna otra).
- **Preview** — Vista previa de como quedaria el tablero con la configuracion actual antes de guardar.
- **Guardar/Cancelar** — Boton de guardar que envia `PUT /api/columns`. Cancelar descarta cambios.

## Estructura de datos

```json
{
  "columns": [
    {
      "id": "backlog",
      "name": "Despriorizado",
      "color": "muted",
      "order": 1,
      "rules": {
        "operator": "AND",
        "conditions": [
          { "field": "labels", "operator": "contains", "value": "backlog" }
        ]
      }
    },
    {
      "id": "draft",
      "name": "Draft",
      "color": "gray",
      "order": 2,
      "rules": {
        "operator": "AND",
        "conditions": [
          { "field": "draft", "operator": "equals", "value": true }
        ]
      }
    },
    {
      "id": "blocked",
      "name": "Bloqueadas",
      "color": "red",
      "order": 3,
      "rules": {
        "operator": "OR",
        "conditions": [
          { "field": "hasConflicts", "operator": "equals", "value": true },
          { "field": "pipelineStatus", "operator": "in", "value": ["failed", "canceled"] },
          { "field": "unresolvedThreads", "operator": "greaterThan", "value": 0 }
        ]
      }
    },
    {
      "id": "review",
      "name": "Code Review",
      "color": "blue",
      "order": 4,
      "rules": {
        "operator": "OR",
        "conditions": [
          { "field": "approvalsGiven", "operator": "lessThan", "value": "$MIN_APPROVALS" },
          { "field": "teamLeadApproved", "operator": "equals", "value": false }
        ]
      }
    },
    {
      "id": "pending",
      "name": "Pendientes",
      "color": "yellow",
      "order": 5,
      "rules": {
        "operator": "OR",
        "conditions": [
          { "field": "pipelineStatus", "operator": "in", "value": ["running", "pending"] },
          { "field": "labels", "operator": "notContains", "value": "qa_approved" }
        ]
      }
    },
    {
      "id": "attention",
      "name": "Requiere atencion",
      "color": "orange",
      "order": 6,
      "rules": {
        "operator": "AND",
        "conditions": [
          { "field": "labels", "operator": "contains", "value": "qa_approved" },
          {
            "operator": "OR",
            "conditions": [
              { "field": "hasConflicts", "operator": "equals", "value": true },
              { "field": "pipelineStatus", "operator": "in", "value": ["failed", "canceled"] },
              { "field": "unresolvedThreads", "operator": "greaterThan", "value": 0 }
            ]
          }
        ]
      }
    },
    {
      "id": "ready",
      "name": "Listas para mergear",
      "color": "green",
      "order": 7,
      "rules": {
        "default": true
      }
    }
  ]
}
```

## Campos disponibles para condiciones

| Campo | Tipo | Descripcion |
|---|---|---|
| `draft` | boolean | Si el MR es draft/WIP |
| `labels` | string[] | Labels asignados al MR |
| `hasConflicts` | boolean | Si tiene conflictos de merge |
| `pipelineStatus` | string | Estado del pipeline: `success`, `failed`, `running`, `pending`, `canceled` |
| `unresolvedThreads` | number | Cantidad de threads sin resolver |
| `approvalsGiven` | number | Cantidad de aprobaciones recibidas |
| `teamLeadApproved` | boolean | Si el team lead aprobo |

## Operadores de condicion

| Operador | Tipos compatibles | Descripcion |
|---|---|---|
| `equals` | todos | Igualdad exacta |
| `notEquals` | todos | Distinto de |
| `greaterThan` | number | Mayor que |
| `lessThan` | number | Menor que |
| `contains` | string[] | El array contiene el valor |
| `notContains` | string[] | El array no contiene el valor |
| `in` | string | El valor esta en la lista dada |

## Operadores logicos

- `AND` — Todas las condiciones deben cumplirse.
- `OR` — Al menos una condicion debe cumplirse.
- Las condiciones se pueden anidar (un grupo dentro de otro) para logica compleja.

## Evaluacion

Las columnas se evaluan en el orden definido por el campo `order`. El MR se asigna a la primera columna cuyas reglas se cumplan. La ultima columna puede tener `"default": true` para capturar los MRs que no matchean ninguna regla anterior.

## Variables de entorno en reglas

Los valores que empiezan con `$` se resuelven contra variables de entorno. Por ejemplo, `"$MIN_APPROVALS"` se reemplaza por el valor de la variable `MIN_APPROVALS` del `.env`.

## Colores disponibles

El frontend ofrece un set predefinido de colores para las columnas, mapeados a las variables CSS del tema:

| Color | Variable CSS | Uso actual |
|---|---|---|
| `green` | `--color-ready` | Listas para mergear |
| `red` | `--color-conflict` | Bloqueadas |
| `yellow` | `--color-pending` | Pendientes |
| `blue` | `--color-accent` | Code Review |
| `orange` | `--color-attention` | Requiere atencion |
| `gray` | `--color-draft` | Draft |
| `muted` | `--color-muted` | Despriorizado |

## Fallback

Si el archivo `columns.json` no existe o tiene errores de formato, el sistema usa la configuracion por defecto (las 7 columnas actuales) y loguea un warning. El endpoint `GET /api/columns` devuelve la config default en ese caso.

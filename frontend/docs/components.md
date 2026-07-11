# Guia de Componentes

## Arbol de componentes

```
App.vue
├── TopBar.vue
├── SearchBar.vue
├── FilterChips.vue
└── MrBoard.vue
    └── BoardColumn.vue (x N columnas)
        └── MrCard.vue (x N merge requests)
            └── BlockerBadge.vue (x 3: pipeline, threads, approvals)
```

---

## `App.vue`

**Tipo**: Componente raiz / Layout

Componente principal que orquesta toda la aplicacion. Conecta el composable `useMergeRequests` con los componentes visuales.

### Responsabilidades

- Inicializa el composable `useMergeRequests()` que arranca el fetch y polling.
- Maneja los tabs de vista ("Por proyecto" / "Por estado").
- Pasa los datos filtrados a los componentes hijos via props.
- Muestra estados de carga, error y vacio.

### Estado local

| Ref          | Tipo   | Descripcion                                    |
|--------------|--------|------------------------------------------------|
| `viewMode`   | string | Vista activa: `"project"` o `"status"`         |

---

## `TopBar.vue`

**Tipo**: Presentacional

Header del dashboard con informacion de estado y acciones globales.

### Props

| Prop          | Tipo   | Default | Descripcion                        |
|---------------|--------|---------|------------------------------------|
| `meta`        | Object | `null`  | Metadatos de la ultima consulta    |
| `loading`     | Boolean| `false` | Si se esta cargando datos          |
| `error`       | String | `null`  | Mensaje de error si existe         |
| `lastFetched` | Date   | `null`  | Timestamp de la ultima actualizacion |

### Eventos

| Evento    | Payload | Descripcion                                      |
|-----------|---------|--------------------------------------------------|
| `refresh` | —       | Emitido al hacer click en "Refrescar ahora"      |

### Indicador de estado (dot)

| Color          | Condicion             |
|----------------|-----------------------|
| Amarillo       | `loading === true`    |
| Rojo           | `error !== null`      |
| Verde          | `lastFetched` existe  |
| Gris           | Sin datos aun         |

---

## `MrBoard.vue`

**Tipo**: Contenedor logico

Recibe la lista de MRs filtrados y los agrupa en columnas segun el modo de vista.

### Props

| Prop             | Tipo   | Default     | Descripcion                          |
|------------------|--------|-------------|--------------------------------------|
| `mergeRequests`  | Array  | requerido   | Lista de MRs ya filtrados            |
| `viewMode`       | String | `"project"` | Modo de agrupacion                   |

### Modos de vista

**Por proyecto** (`viewMode: "project"`):
- Agrupa MRs por `projectPath`.
- Cada columna es un proyecto, ordenadas alfabeticamente.

**Por estado** (`viewMode: "status"`):
- Agrupa MRs por `mergeability`.
- Columnas fijas: Bloqueadas (red), Pendientes (yellow), Listas para mergear (green), Draft (gray).

---

## `BoardColumn.vue`

**Tipo**: Presentacional

Columna individual del tablero con header y lista de cards.

### Props

| Prop            | Tipo   | Descripcion                         |
|-----------------|--------|-------------------------------------|
| `title`         | String | Titulo de la columna                |
| `mergeRequests` | Array  | MRs a mostrar en esta columna      |

### Comportamiento

- Muestra el contador de MRs en un badge junto al titulo.
- Si no hay MRs, muestra el texto "Sin MRs".
- El cuerpo tiene `overflow-y: auto` con altura maxima de `74vh`.

---

## `MrCard.vue`

**Tipo**: Presentacional

Card principal que representa un Merge Request individual.

### Props

| Prop | Tipo   | Descripcion                 |
|------|--------|-----------------------------|
| `mr` | Object | Objeto MR del backend       |

### Estructura visual

```
┌─────────────────────────────────┐
│▌ Titulo del MR (link)           │  ← Borde izquierdo de color
│  fix/login → main               │  ← Ramas
│  [CI OK] [0 hilos] [1/2]       │  ← Blocker badges
│  Juan Perez · 2h     [Draft]   │  ← Autor + tiempo + tags
│  [bug] [priority::high]        │  ← Labels (max 4)
└─────────────────────────────────┘
```

### Color del borde izquierdo

| Mergeability | Color             | Codigo   |
|--------------|-------------------|----------|
| `green`      | Verde (ready)     | #4FB477  |
| `yellow`     | Amarillo (draft)  | #D9A441  |
| `red`        | Rojo (conflict)   | #E5484D  |
| `gray`       | Gris (text-faint) | #5C6270  |

---

## `BlockerBadge.vue`

**Tipo**: Presentacional

Pill/badge que muestra el estado de un bloqueante individual.

### Props

| Prop   | Tipo   | Descripcion                                            |
|--------|--------|--------------------------------------------------------|
| `type` | String | Tipo de bloqueante: `"pipeline"`, `"threads"`, `"approvals"` |
| `data` | Object | Datos del bloqueante (estructura segun tipo)           |

### Variantes por tipo

**Pipeline**:

| Estado               | Color    | Label       |
|----------------------|----------|-------------|
| `success`            | Verde    | CI OK       |
| `failed` / `canceled`| Rojo     | CI Fallo    |
| `running` / `pending`| Amarillo | CI...       |
| `none` / `unknown`   | Gris     | Sin CI / CI?|

**Threads**:

| Estado              | Color  | Label              |
|---------------------|--------|--------------------|
| `unresolvedCount > 0` | Rojo   | `{N} hilo(s)`    |
| `unresolvedCount = 0` | Verde  | Hilos OK          |

**Approvals**:

| Estado       | Color    | Label         |
|--------------|----------|---------------|
| `approved`   | Verde    | `{N}/{N}`     |
| `pending`    | Amarillo | `{dado}/{req}`|
| `unknown`    | Gris     | Approvals ?   |

---

## `SearchBar.vue`

**Tipo**: Input controlado

Input de busqueda con v-model bidireccional.

### Props

| Prop         | Tipo   | Descripcion             |
|--------------|--------|-------------------------|
| `modelValue` | String | Texto de busqueda actual |

### Eventos

| Evento              | Payload | Descripcion                    |
|---------------------|---------|--------------------------------|
| `update:modelValue` | String  | Nuevo valor del input          |

### Busqueda

Filtra MRs por coincidencia parcial (case-insensitive) en: titulo, autor, rama origen, rama destino y path del proyecto.

---

## `FilterChips.vue`

**Tipo**: Presentacional interactivo

Chips toggleables para filtrar MRs por proyecto.

### Props

| Prop             | Tipo   | Descripcion                      |
|------------------|--------|----------------------------------|
| `projects`       | Array  | Lista de nombres de proyectos    |
| `activeProjects` | Set    | Proyectos actualmente activos    |

### Eventos

| Evento   | Payload | Descripcion                          |
|----------|---------|--------------------------------------|
| `toggle` | String  | Nombre del proyecto toggled          |

### Comportamiento

- Los chips activos se resaltan con borde y fondo de color accent.
- Al hacer click en un chip, se alterna su estado activo/inactivo.
- Los MRs de proyectos inactivos se ocultan del tablero.

---

## Composable: `useMergeRequests()`

**Archivo**: `src/composables/useMergeRequests.js`

Maneja todo el estado reactivo, la comunicacion con el backend y la logica de polling.

### Estado reactivo exportado

| Ref/Computed     | Tipo       | Descripcion                                 |
|------------------|------------|---------------------------------------------|
| `mergeRequests`  | Ref        | Lista cruda de MRs del backend              |
| `meta`           | Ref        | Metadatos de la respuesta (`fetchedAt`, etc) |
| `loading`        | Ref        | `true` durante un fetch                     |
| `error`          | Ref        | Mensaje de error o `null`                    |
| `lastFetched`    | Ref        | `Date` de la ultima consulta exitosa         |
| `searchQuery`    | Ref        | Texto del filtro de busqueda                |
| `activeProjects` | Ref        | `Set` de proyectos activos para filtrar     |
| `projects`       | Computed   | Lista unica de proyectos (derivada de MRs)  |
| `filteredMRs`    | Computed   | MRs filtrados por busqueda + proyectos      |

### Metodos exportados

| Metodo            | Parametros | Descripcion                                          |
|-------------------|------------|------------------------------------------------------|
| `fetchMRs(force)` | `boolean`  | Consulta el backend. `force=true` bypasea cache      |
| `toggleProject(p)`| `string`   | Alterna un proyecto en el filtro activo               |

### Ciclo de vida

- **`onMounted`**: Ejecuta `fetchMRs()` y arranca `setInterval` cada 5 minutos.
- **`onUnmounted`**: Limpia el interval con `clearInterval`.

### Flujo de polling

```
Componente monta
    │
    ├── fetchMRs() ──→ GET /api/pull-requests ──→ Actualiza estado
    │
    └── setInterval(fetchMRs, 300000)  ← 5 minutos
            │
            ├── Tick 1: fetchMRs()
            ├── Tick 2: fetchMRs()
            └── ... (hasta que el componente se desmonte)
```

### Manejo de errores

- Si el fetch falla, `error.value` se setea con el mensaje.
- Los datos previos (`mergeRequests.value`) se preservan — el usuario ve datos stale con un indicador de error en el TopBar.
- Al siguiente fetch exitoso, `error.value` se limpia automaticamente.

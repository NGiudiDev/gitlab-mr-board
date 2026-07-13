# Frontend — GitLab MR Board Dashboard

## Descripcion general

Aplicacion web construida con **Vue.js 3** (Composition API) y **Tailwind CSS** que muestra un dashboard de Merge Requests de GitLab. Consume datos del backend BFF y los presenta en secciones colapsables por repositorio, cada una con columnas tipo kanban por estado de mergeabilidad.

## Estructura del codigo

```
src/
├── main.js                          # Bootstrap de la app Vue
├── App.vue                          # Componente raiz, layout principal
├── assets/
│   └── main.css                     # Tailwind directives + estilos globales
├── composables/
│   └── useMergeRequests.js          # Estado reactivo, fetch, polling, filtros
└── components/
    ├── TopBar.vue                   # Header con titulo, status y boton refrescar
    ├── MrBoard.vue                  # Tableros colapsables por repositorio
    ├── BoardColumn.vue              # Columna de estado individual
    ├── MrCard.vue                   # Card de MR con bloqueantes visuales
    ├── BlockerBadge.vue             # Pill/badge de un bloqueante individual
    └── SearchBar.vue                # Input de busqueda
```

## Arbol de componentes

```
App.vue
├── TopBar.vue
├── SearchBar.vue
└── MrBoard.vue (secciones colapsables por repositorio)
    └── BoardColumn.vue (x 7 columnas de estado)
        └── MrCard.vue (x N merge requests)
            └── BlockerBadge.vue (x 3: pipeline, threads, approvals)
```

---

## `App.vue`

**Tipo**: Componente raiz / Layout

Componente principal que orquesta toda la aplicacion. Conecta el composable `useMergeRequests` con los componentes visuales.

### Responsabilidades

- Inicializa el composable `useMergeRequests()` que arranca el fetch y polling.
- Pasa los datos filtrados y la lista de proyectos (`meta.allProjects`) a `MrBoard`.
- Muestra estados de carga, error y vacio.

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

Muestra una seccion colapsable por cada repositorio. Dentro de cada seccion, organiza los MRs en columnas por estado de mergeabilidad. Se muestran todos los proyectos configurados, incluso sin MRs abiertos. Todas las secciones inician colapsadas.

### Props

| Prop             | Tipo   | Default     | Descripcion                                    |
|------------------|--------|-------------|-------------------------------------------------|
| `mergeRequests`  | Array  | requerido   | Lista de MRs ya filtrados                       |
| `allProjects`    | Array  | `[]`        | Paths de todos los proyectos configurados       |

### Comportamiento

- Agrupa MRs por `projectPath` y muestra un header colapsable por repositorio con el nombre y la cantidad de MRs.
- Los proyectos de `allProjects` sin MRs se muestran con 0 MRs.
- Dentro de cada seccion, muestra 7 columnas fijas por estado: Draft (gray), Bloqueadas (red), Pendientes (yellow), Code Review (review), Requiere atencion (attention), Listas para mergear (green), Despriorizado (backlog).
- El estado de expansion se almacena en un `ref({})` reactivo (objeto con keys por repo).

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
- El cuerpo tiene `overflow-y: auto` con altura maxima de `60vh`.

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
│  [CI OK] [0 hilos] [1/2]        │  ← Blocker badges
│  Juan Perez · 2h     [Draft]    │  ← Autor + tiempo + tags
│  [bug] [priority::high]         │  ← Labels (max 4)
└─────────────────────────────────┘
```

### Color del borde izquierdo

| Mergeability | Color               | Clase Tailwind          |
|--------------|---------------------|-------------------------|
| `green`      | Verde (ready)       | `border-l-ready`        |
| `yellow`     | Amarillo (draft)    | `border-l-draft`        |
| `red`        | Rojo (conflict)     | `border-l-conflict`     |
| `gray`       | Gris (text-faint)   | `border-l-text-faint`   |
| `review`     | Azul                | `border-l-blue-400`     |
| `attention`  | Naranja             | `border-l-orange-400`   |
| `backlog`    | Gris claro (muted)  | `border-l-text-muted`   |

---

## `BlockerBadge.vue`

**Tipo**: Presentacional

Pill/badge que muestra el estado de un bloqueante individual. El badge de pipeline es clickeable y abre el pipeline en GitLab.

### Props

| Prop   | Tipo   | Descripcion                                            |
|--------|--------|--------------------------------------------------------|
| `type` | String | Tipo de bloqueante: `"pipeline"`, `"threads"`, `"approvals"` |
| `data` | Object | Datos del bloqueante (estructura segun tipo)           |

### Comportamiento

- El componente raiz usa `<component :is>` dinamico: si el badge tiene un `pipelineUrl`, renderiza un `<a>` clickeable; si no, un `<span>`.
- Los badges de pipeline abren el link en una nueva pestana (`target="_blank"`).

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

### Tooltip de approvals

El tooltip muestra informacion detallada:
- Cantidad de approvals dados sobre los requeridos (`X/2 aprobaciones`)
- Usernames de quienes aprobaron (`Aprobado por: user1, user2`)
- Indicador si falta la aprobacion del lider (`Falta aprobación del líder`)

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

## Composable: `useMergeRequests()`

**Archivo**: `src/composables/useMergeRequests.js`

Maneja todo el estado reactivo, la comunicacion con el backend y la logica de polling.

### Estado reactivo exportado

| Ref/Computed     | Tipo       | Descripcion                                 |
|------------------|------------|---------------------------------------------|
| `mergeRequests`  | Ref        | Lista cruda de MRs del backend              |
| `meta`           | Ref        | Metadatos de la respuesta (`fetchedAt`, `allProjects`, etc) |
| `loading`        | Ref        | `true` durante un fetch                     |
| `error`          | Ref        | Mensaje de error o `null`                    |
| `lastFetched`    | Ref        | `Date` de la ultima consulta exitosa         |
| `searchQuery`    | Ref        | Texto del filtro de busqueda                |
| `filteredMRs`    | Computed   | MRs filtrados por busqueda de texto          |

### Metodos exportados

| Metodo            | Parametros | Descripcion                                          |
|-------------------|------------|------------------------------------------------------|
| `fetchMRs(force)` | `boolean`  | Consulta el backend. `force=true` bypasea cache      |

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

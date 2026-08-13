# Arquitectura del frontend

## Objetivo

Se reorganizó el frontend para seguir un estilo de arquitectura limpia y mantener cada capa con una responsabilidad clara:

- `app/`: composición de la aplicación y layout global.
- `features/mergeRequests/`: funcionalidad principal del tablero de MRs.
- `assets/`: recursos globales y estilos base.
- `main.js`: bootstrap de Vue.

Esto reduce el acoplamiento entre la vista, la lógica de datos y los componentes reutilizables.

## Estructura actual

```text
frontend/src/
├── app/
│   └── App.vue
├── assets/
│   └── main.css
├── features/
│   └── mergeRequests/
│       ├── components/
│       │   ├── BlockerBadge.vue
│       │   ├── BoardColumn.vue
│       │   ├── FilterChips.vue
│       │   ├── MrBoard.vue
│       │   ├── MrCard.vue
│       │   ├── SearchBar.vue
│       │   └── TopBar.vue
│       └── composables/
│           └── useMergeRequests.js
├── main.js
└── ...
```

## Capas y responsabilidades

### 1. app/

Es la capa de orquestación de la aplicación. Aquí vive la pantalla principal que monta el layout del dashboard y conecta los casos de uso con la UI.

Ejemplo:

- combina el composable `useMergeRequests()`
- renderiza `TopBar`, `SearchBar` y `MrBoard`
- gestiona estados de carga, error y vacío

### 2. features/mergeRequests/

Es la feature principal de negocio. Encapsula todo lo relacionado con la visualización y gestión de Merge Requests.

Dentro de esta carpeta se separan dos subcapas:

- `components/`: presentacionales y de UI
- `composables/`: lógica reactiva y consulta de datos

### 3. assets/

Contiene estilos globales, tokens visuales y configuraciones compartidas que se aplican a todo el proyecto.

## Principios aplicados

### Separación por responsabilidad

- La capa `app` coordina.
- La feature `mergeRequests` contiene la lógica y los componentes específicos.
- Los estilos no se mezclan con la funcionalidad del negocio.

### Reutilización

Los componentes dentro de `features/mergeRequests/components` están pensados para ser reutilizables dentro del mismo dominio de la aplicación.

### Escalabilidad

Si en el futuro se agrega otra feature, por ejemplo `projects`, `notifications` o `settings`, se puede seguir el mismo patrón:

```text
src/
├── app/
├── features/
│   ├── mergeRequests/
│   ├── projects/
│   └── settings/
├── assets/
├── shared/
└── main.js
```

## Regla de organización recomendada

- Los componentes que solo pertenecen a una feature deben vivir dentro de esa feature.
- Los composables deben estar junto a la feature a la que pertenecen.
- La capa `app` debe permanecer lo más simple posible.
- La lógica global compartida puede moverse a `shared/` cuando crezca.

## Beneficios

- menos acoplamiento entre pantallas y componentes
- más legibilidad del proyecto
- más fácil de extender con nuevas features
- mantenimiento más predecible
- alineación con una arquitectura limpia, sin sobre-ingeniería

## Siguiente paso recomendado

Cuando el frontend crezca, conviene introducir una carpeta `shared/` para:

- utilidades
- formateadores
- constantes
- hooks globales
- tipos compartidos

Esto permite mantener `features/` enfocada solo en dominio y no en infraestructura general.

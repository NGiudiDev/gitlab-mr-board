# Frontend — GitLab MR Board Dashboard

## Descripcion general

Aplicacion web construida con **Vue.js 3** (Composition API) y **Tailwind CSS** que muestra un dashboard de Merge Requests de GitLab. Consume datos del backend BFF y los presenta en un tablero visual tipo kanban con indicadores de color por bloqueante.

## Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- El **backend** corriendo en `http://localhost:3001` (o configurar `VITE_API_BASE_URL`)

## Instalacion

```bash
cd frontend
npm install
```

## Configuracion

| Variable             | Archivo | Default | Descripcion                           |
|----------------------|---------|---------|---------------------------------------|
| `VITE_API_BASE_URL`  | `.env`  | `""`    | URL base del backend (vacio usa proxy) |

En desarrollo con `vite dev`, el proxy configurado en `vite.config.js` redirige `/api/*` a `http://localhost:3001`, por lo que no hace falta configurar `VITE_API_BASE_URL`.

Para produccion, setear la URL del backend:

```env
VITE_API_BASE_URL=https://mi-backend.ejemplo.com
```

## Ejecucion

```bash
# Desarrollo (con hot-reload)
npx vite

# Build para produccion
npx vite build

# Preview del build de produccion
npx vite preview
```

## Stack tecnologico

| Tecnologia     | Version | Proposito                                |
|----------------|---------|------------------------------------------|
| Vue.js         | 3.5+    | Framework reactivo (Composition API)     |
| Vite           | 6.x     | Build tool y dev server                  |
| Tailwind CSS   | 3.4+    | Framework de estilos utility-first       |
| PostCSS        | 8.x     | Procesador CSS (requerido por Tailwind)  |
| Autoprefixer   | 10.x    | Prefijos CSS automaticos                 |

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
    ├── MrBoard.vue                  # Contenedor del tablero (columnas)
    ├── BoardColumn.vue              # Columna individual con lista de cards
    ├── MrCard.vue                   # Card de MR con bloqueantes visuales
    ├── BlockerBadge.vue             # Pill/badge de un bloqueante individual
    ├── SearchBar.vue                # Input de busqueda
    └── FilterChips.vue              # Chips de filtro por proyecto
```

Documentacion detallada de componentes en [components.md](./components.md).

Documentacion de la guia de estilos en [styling.md](./styling.md).

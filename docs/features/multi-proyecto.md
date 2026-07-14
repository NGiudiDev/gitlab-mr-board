# Multi-proyecto

Soporte para monitorear Merge Requests de multiples repositorios de GitLab en un solo tablero.

## Como funciona

El backend recibe una lista de IDs de proyecto de GitLab via la variable de entorno `PROJECT_IDS` (separados por coma). Al hacer fetch, consulta todos los proyectos en paralelo y consolida los resultados.

## Agrupacion en el frontend

El frontend agrupa los MRs por `projectPath` y renderiza una seccion colapsable por cada repositorio. Cada seccion contiene sus propias 7 columnas de estado.

## Configuracion

```env
PROJECT_IDS=123,456,789
```

## Implementacion

- **Backend**: `mergeRequestService.js` itera sobre los project IDs y lanza fetches en paralelo con `Promise.all`.
- **Frontend**: `MrBoard.vue` agrupa los MRs usando el campo `projectPath` del response.

## Limitaciones

- Se soporta paginacion de hasta 10 paginas de 100 resultados por proyecto.
- La cantidad de proyectos impacta el tiempo de respuesta (mas proyectos = mas llamadas a la API de GitLab).

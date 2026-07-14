# Auto-polling y cache

Mecanismo de refresco automatico de datos y cache en el backend para mantener el tablero actualizado sin sobrecargar la API de GitLab.

## Auto-polling (frontend)

El composable `useMergeRequests.js` configura un intervalo de polling que refresca los datos automaticamente cada 5 minutos.

El usuario tambien puede forzar un refresco manual con el boton "Refrescar ahora" en el `TopBar`, que envia el parametro `?force=true`.

## Cache (backend)

El backend implementa cache en memoria en la ruta `GET /api/pull-requests`:

- Los resultados se cachean por un TTL configurable (default: 60 segundos).
- Si el cache es valido, se devuelve la respuesta cacheada sin llamar a GitLab.
- El parametro `?force=true` fuerza un bypass del cache.

## Indicador de estado

El `TopBar` muestra un indicador visual de conexion:

| Color | Estado |
|---|---|
| Verde | Conectado, datos cargados |
| Amarillo | Cargando datos |
| Rojo | Error de conexion |

Tambien muestra la hora del ultimo fetch exitoso.

## Configuracion

```env
POLL_CACHE_TTL_MS=60000
```

# Columnas configurables

- Estado: propuesta, no implementada.

## Objetivo

Permitir que las columnas, su orden, nombre, color y reglas de clasificación dejen de estar fijas en el código.

La propuesta original plantea una interfaz de configuración, endpoints `GET /api/columns` y `PUT /api/columns`, y persistencia en un archivo `columns.json` del backend.

## Requisitos de la propuesta

- Debe existir al menos una columna y exactamente una predeterminada.
- Cada columna debe tener `id`, `name`, `color` y `rules`.
- Los IDs deben ser únicos y las condiciones deben referenciar campos válidos.
- El backend debe validar el documento completo antes de persistirlo.
- La clasificación debe conservar un comportamiento determinista.

Antes de implementarla se debe registrar una decisión sobre persistencia, concurrencia y compatibilidad con varias instancias.

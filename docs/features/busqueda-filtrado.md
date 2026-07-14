# Busqueda y filtrado

Filtrado en tiempo real de Merge Requests por texto.

## Como funciona

El usuario escribe en la barra de busqueda y los MRs se filtran instantaneamente (sin llamada al backend). La busqueda se aplica sobre multiples campos del MR:

- Titulo
- Autor
- Branch de origen
- Branch de destino
- Path del proyecto

## Implementacion

El filtrado es case-insensitive y se aplica del lado del cliente sobre los datos ya cargados en memoria.

## Filter Chips (no activo)

Existe un componente `FilterChips.vue` que permite filtrar por proyecto mediante toggle buttons. Esta definido pero no esta conectado actualmente en `App.vue`.

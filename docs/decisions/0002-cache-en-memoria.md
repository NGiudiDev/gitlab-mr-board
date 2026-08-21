# ADR 0002: conservar caché en memoria

- Estado: aceptada
- Fecha: preexistente al registro documental

## Contexto

Los detalles de cada MR multiplican las llamadas a GitLab y el tablero tolera datos brevemente desactualizados.

## Decisión

Guardar la última respuesta en memoria durante un TTL configurable y permitir que `force=true` la omita.

## Consecuencias

Reduce latencia y llamadas, pero se pierde al reiniciar y no se comparte entre instancias. Un escalado horizontal exige reevaluar la decisión.

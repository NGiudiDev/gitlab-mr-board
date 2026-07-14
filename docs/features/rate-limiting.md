# Rate limiting

Control de concurrencia en las llamadas a la API de GitLab para evitar sobrecargar el servidor.

## Como funciona

El backend implementa un rate limiter basado en concurrencia (patron semaforo) que limita la cantidad de requests simultaneos a la API de GitLab.

- **Maximo de requests concurrentes**: 6
- Las llamadas que exceden el limite se encolan y se ejecutan cuando se libera un slot.

## Por que es necesario

Al consultar multiples proyectos, cada MR requiere 3 llamadas adicionales (approvals, threads, pipeline). Con muchos proyectos y MRs, la cantidad de requests puede escalar rapidamente. Sin rate limiting, se corre el riesgo de:

- Recibir errores 429 (Too Many Requests) de GitLab.
- Sobrecargar el servidor de GitLab.
- Timeouts por exceso de conexiones simultaneas.

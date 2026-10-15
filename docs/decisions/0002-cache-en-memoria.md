# ADR 0002: Caché en memoria

- Estado: Aceptada
- Fecha: 2026-07-10

## Contexto

Construir el tablero requiere consultar los merge requests de cada proyecto y enriquecer cada resultado con aprobaciones, discusiones y pipelines. Una sola actualización puede producir muchas solicitudes a GitLab; el polling, las recargas manuales y varias personas de una misma cuenta repetirían ese trabajo sobre los mismos datos.

GitLab es una dependencia externa con latencia y límites propios. El tablero necesita reducir solicitudes y responder con rapidez, pero no requiere consistencia instantánea: puede mostrar durante un período corto la última respuesta satisfactoria y ofrece una actualización explícita cuando alguien necesita datos nuevos.

## Decisión

Mantener en la memoria del proceso del backend **una respuesta consolidada por cuenta**. La entrada contiene únicamente los datos compartidos obtenidos de GitLab y queda vigente durante un TTL configurable mediante `POLL_CACHE_TTL_MS`, de 60 segundos por omisión.

La caché sigue estas reglas:

- una consulta normal reutiliza la entrada mientras su TTL esté vigente;
- `GET /api/pull-requests?force=true` omite la lectura, consulta GitLab y reemplaza la entrada;
- una respuesta fallida nunca reemplaza la última respuesta satisfactoria;
- cambiar el token o los proyectos de la cuenta invalida la entrada anterior;
- las cuentas nunca comparten entradas, aunque consulten los mismos proyectos;
- los datos propios de quien consulta y las fechas de subida persistidas se agregan al responder y no forman parte de la entrada compartida.

La caché no se persiste ni se comparte entre procesos. Los detalles de su implementación se mantienen en la sección de [caché de la arquitectura del backend](../architecture/backend.md#caché).

## Alternativas consideradas

- **Consultar GitLab en cada solicitud:** entrega siempre el dato más reciente, pero multiplica la latencia y el consumo de la API sin aportar una diferencia relevante para el tablero.
- **Delegar la caché al navegador:** evita algunas repeticiones de una persona, pero no comparte resultados entre integrantes de la cuenta ni reduce el trabajo del backend ante sesiones distintas.
- **Persistir las respuestas en Postgres:** permitiría compartirlas entre instancias, pero mezcla datos externos efímeros con la persistencia propia del producto y exige vencimiento y limpieza explícitos.
- **Usar una caché distribuida:** resuelve el escalado horizontal, pero incorpora infraestructura y operación que no se justifican para el volumen inicial. Debe reconsiderarse si varias instancias generan una carga relevante sobre GitLab.

## Consecuencias

### Positivas

- Las personas de una cuenta comparten el costo de consultar y enriquecer los mismos merge requests.
- Disminuyen la latencia del tablero y la cantidad de solicitudes a GitLab.
- No se agrega otra dependencia de infraestructura ni un ciclo de limpieza persistente.
- Reiniciar el proceso descarta naturalmente cualquier dato almacenado.

### Negativas

- Una respuesta puede quedar desactualizada hasta que venza el TTL o alguien fuerce la actualización.
- Cada instancia mantiene su propia copia y puede entregar una versión diferente durante ese período.
- Escalar horizontalmente multiplica las consultas a GitLab y reduce la efectividad global de la caché.
- Las entradas ocupan memoria del proceso y permanecen allí hasta ser reemplazadas o hasta que el proceso se reinicia.

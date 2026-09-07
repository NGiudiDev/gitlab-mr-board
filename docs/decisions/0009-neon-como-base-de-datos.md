# ADR 0009: reemplazar SQLite local por Neon

- Estado: aceptada
- Fecha: 2026-09-07

## Contexto

El [ADR 0006](0006-login-local-con-sqlite.md) resolvió la persistencia con una base SQLite local abierta con `node:sqlite`, y anticipó su límite: «el archivo de la base es un dato que hay que respaldar y no se comparte entre instancias. Un escalado horizontal exige reevaluar esta decisión».

Ese límite se volvió concreto. La base guarda ahora usuarios, sesiones y —desde el [ADR 0008](0008-credenciales-de-gitlab-por-usuario.md)— las credenciales de GitLab de cada persona. Un archivo en el disco del proceso significa que cualquier despliegue con sistema de archivos efímero borra las cuentas, que no se puede correr más de una instancia, y que el respaldo es un procedimiento manual aparte.

## Decisión

Persistir en **Neon**, un Postgres serverless administrado, con el driver oficial `@neondatabase/serverless`.

- `DATABASE_PATH` se reemplaza por `DATABASE_URL`, obligatoria. Conviene la cadena del pooler: el backend abre su propio pool.
- El esquema se sigue aplicando en cada arranque con `CREATE TABLE IF NOT EXISTS`, ahora desde `index.ts` antes de escuchar. Se mantiene la idea del ADR 0006: tres tablas no justifican una herramienta de migraciones.
- Los repositorios reciben una interfaz `Database` mínima —`query` y `close`— en lugar del driver. Es lo que permite que los test corran contra otro Postgres sin que el código de producción lo sepa.
- Los test usan **PGlite**, Postgres compilado a WebAssembly que corre en memoria dentro del proceso de Vitest. `npm test` sigue sin necesitar red, Docker ni credenciales, y el SQL de los repositorios se ejecuta de verdad.

## Alternativas consideradas

- **`pg` (node-postgres) contra Neon**: funciona sin nada especial y es neutral respecto del proveedor. Se descartó por poco margen: `@neondatabase/serverless` expone el mismo API de `Pool`, así que cambiarlo más adelante es reemplazar un import, y a cambio deja abierta la puerta a desplegar el backend en una plataforma serverless sin volver a tocar la capa de datos.
- **Un ORM como Drizzle o Prisma**: da tipos derivados del esquema y migraciones versionadas, pero es una dependencia grande para tres tablas y contradice la idea de proyecto liviano.
- **Postgres real en los test, con Docker o una rama de Neon**: es lo más fiel, pero `npm test` dejaría de correr solo y la suite pasaría a depender de credenciales y de limpieza entre casos.
- **Repositorios falsos en memoria para los test**: rápido y sin dependencias, pero el SQL real quedaría sin cubrir.
- **Seguir con SQLite y montar un volumen persistente**: es lo que hoy documenta la guía de producción. Resuelve el respaldo pero no el escalado, y ata el despliegue a las plataformas que ofrecen volúmenes.

## Consecuencias

- **Toda la capa de datos pasa a ser asíncrona.** `node:sqlite` era síncrono; Postgres no. Los repositorios, los servicios de autenticación y de configuración de GitLab, y el middleware de sesión devuelven promesas. Es el costo real de la migración y afecta a casi todo el backend.
- Validar una sesión pasa a ser una consulta de red. Un fallo de la base ya no puede confundirse con una sesión inválida —eso desloguearía a todo el mundo ante una caída pasajera—, así que el middleware responde **503** y no 401. Por el mismo motivo, todo handler asíncrono necesita su propio `try/catch`: Express 4 no captura promesas rechazadas.
- Aparece latencia donde antes no había: cada consulta cruza la red. Para un tablero interno es aceptable, y el pool amortigua el costo de conexión.
- El backend vuelve a ser reemplazable: se pueden correr varias instancias. La caché sigue siendo en memoria y por proceso ([ADR 0002](0002-cache-en-memoria.md)), así que instancias distintas siguen sin compartirla.
- El respaldo pasa a ser responsabilidad de Neon, con sus ramas y su recuperación por punto en el tiempo. Lo que sigue siendo responsabilidad propia es `ENCRYPTION_KEY`: sin ella, un volcado de la base no alcanza para recuperar los access token.
- Se suman dos dependencias: `@neondatabase/serverless` en producción y `@electric-sql/pglite` sólo para los test.
- Los tipos de columna aprovechan Postgres: las marcas temporales son `TIMESTAMPTZ` en lugar de texto, y los IDs de proyecto son `TEXT[]` en lugar de una cadena separada por comas.

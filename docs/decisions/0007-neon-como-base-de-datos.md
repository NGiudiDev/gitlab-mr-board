# ADR 0007: Neon como base de datos

- Estado: Aceptada
- Fecha: 2026-09-07

## Contexto

El backend necesita persistir cuentas, usuarios, sesiones, configuraciones de GitLab y datos compartidos del tablero. Esa información debe sobrevivir a cada despliegue, estar disponible para todas las instancias de la aplicación y conservar la integridad de las relaciones entre entidades.

El entorno de ejecución no garantiza un sistema de archivos persistente. Por lo tanto, la base debe ser un servicio externo, admitir conexiones desde procesos de vida corta y ofrecer una tecnología relacional que también pueda ejecutarse de manera representativa en los test.

## Decisión

Usar **PostgreSQL alojado en Neon** como base de datos de la aplicación.

- El backend se conecta mediante `@neondatabase/serverless` y la variable obligatoria `DATABASE_URL`. Se recomienda la cadena del pooler de Neon para administrar las conexiones de forma adecuada.
- Se abre un único pool por proceso y todos los repositorios comparten esa conexión. Así, las claves foráneas y las operaciones relacionadas se ejecutan dentro de la misma base.
- Los repositorios dependen de una interfaz mínima `Database` —`query` y `close`—, no del driver concreto. El acceso a datos queda desacoplado sin ocultar las capacidades relacionales de PostgreSQL.
- El esquema se aplica al iniciar el backend mediante sentencias idempotentes, antes de atender solicitudes. El tamaño actual no justifica incorporar una herramienta de migraciones ni un ORM.
- Los test unitarios y de integración ejecutan los repositorios contra **PGlite**, PostgreSQL compilado a WebAssembly. Los test de extremo a extremo usan una base de Neon separada.

Los detalles de conexión, inicialización y organización de repositorios se mantienen en la [arquitectura del backend](../architecture/backend.md). La estrategia de test se documenta en [Test](../development/test.md).

## Alternativas consideradas

- **PostgreSQL administrado por el equipo**: ofrece control total, pero agrega mantenimiento, actualizaciones, respaldo y monitoreo de infraestructura que no forman parte del producto.
- **Otro servicio administrado de PostgreSQL**: cumple las necesidades relacionales, pero Neon ofrece conexión mediante pooler y un driver preparado para entornos serverless con una operación mínima para este proyecto.
- **Una base embebida en el sistema de archivos**: simplifica el desarrollo inicial, pero no comparte datos entre instancias y depende de almacenamiento persistente en el servidor.
- **Acceder mediante `pg`**: mantiene independencia del proveedor, aunque no aprovecha la integración oficial de Neon. La interfaz `Database` limita el costo de cambiar el driver si fuera necesario.
- **Incorporar un ORM y migraciones versionadas**: automatiza parte de la evolución del esquema, a costa de una dependencia y una capa adicional que no se justifican para el modelo actual.

## Consecuencias

- Todas las instancias del backend comparten una fuente de datos durable y pueden escalar sin depender del disco del proceso.
- El acceso a la base es asíncrono y atraviesa la red. Los repositorios y servicios trabajan con promesas, y una indisponibilidad de Neon responde HTTP 503 en lugar de confundirse con un error de autenticación.
- El pool reduce el costo de conexión y debe tolerar que Neon suspenda la computación durante períodos de inactividad.
- Neon se ocupa de la disponibilidad y de las herramientas de respaldo de la base. Los secretos de la aplicación, en especial `ENCRYPTION_KEY`, siguen siendo responsabilidad del despliegue: sin esa clave no se pueden descifrar los access token almacenados.
- La aplicación incorpora una dependencia operativa de Neon, acotada por el uso de PostgreSQL estándar y por la interfaz `Database` de los repositorios.
- PGlite permite validar localmente el esquema, las consultas y las restricciones sin red, Docker ni credenciales, pero no reproduce las características operativas del servicio Neon.
- Las sentencias idempotentes mantienen simple la inicialización actual. Si el esquema requiere transformaciones no compatibles o coordinación entre versiones, será necesario adoptar migraciones versionadas.

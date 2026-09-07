# ADR 0006: resolver el login con usuarios locales en SQLite

- Estado: aceptada
- Fecha: 2026-09-06

## Contexto

El tablero expone los merge requests de varios proyectos y, con ellos, quién es responsable de cada uno. Hasta ahora `GET /api/pull-requests` respondía a cualquiera que alcanzara el backend.

Hacía falta una barrera de acceso con estado propio: quién puede entrar y qué sesiones están vigentes. El proyecto es intencionalmente liviano y corre como una sola instancia, así que la solución tenía que sumar el mínimo de infraestructura posible.

## Decisión

Autenticar con usuario y contraseña propios del tablero, y persistir usuarios y sesiones en una base **SQLite local** abierta con el módulo `node:sqlite`, incluido en Node desde 22.13 sin flags.

- Las contraseñas se guardan derivadas con **scrypt** (`node:crypto`), con la sal y los parámetros dentro del propio hash.
- La sesión viaja en una **cookie `HttpOnly`** y en la base sólo se guarda el hash SHA-256 del token.
- Las altas, bajas y cambios de contraseña se hacen por línea de comandos. El [ADR 0007](0007-registro-abierto-y-gestion-de-usuarios.md) sumó después el registro abierto y la pantalla de administración.

Las reglas y el modelo de datos se documentan en el [dominio de autenticación](../domains/autenticacion.md).

## Alternativas consideradas

- **OAuth con GitLab**: evita custodiar contraseñas y alinea la identidad con la de los merge requests, pero obliga a registrar una aplicación en GitLab y a mantener el intercambio de tokens. Queda como evolución natural si el equipo crece.
- **Postgres administrado (Neon, Supabase)**: innecesario para una instancia única; suma un servicio externo y latencia de red a cada validación de sesión.
- **Sesiones sólo en memoria**: cada reinicio del backend cerraría todas las sesiones.

## Consecuencias

- No se agregan dependencias: `node:sqlite` y `node:crypto` son parte del runtime. A cambio, el mínimo de Node pasa a ser un requisito duro y no sólo una recomendación de herramientas.
- El backend deja de ser sin estado: el archivo de la base es un dato que hay que respaldar y no se comparte entre instancias. Un escalado horizontal exige reevaluar esta decisión, igual que la [caché en memoria](0002-cache-en-memoria.md).
- El proyecto pasa a custodiar contraseñas, con las obligaciones que eso implica: derivación costosa, freno de fuerza bruta y cookie fuera del alcance de JavaScript.
- El alta de usuarios es manual. Es aceptable para un equipo chico y evita construir una pantalla de administración que nadie pidió; el [ADR 0007](0007-registro-abierto-y-gestion-de-usuarios.md) revisó esta consecuencia.

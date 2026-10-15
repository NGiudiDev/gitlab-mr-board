# ADR 0006: Login de usuarios

- Estado: Aceptada
- Fecha: 2026-09-06

## Contexto

El tablero expone información interna de varios proyectos y permite modificar datos compartidos por una cuenta. Antes de incorporar autenticación, cualquier persona que alcanzara el backend podía consultar `GET /api/pull-requests`.

La identidad del tablero no puede depender del access token de GitLab: ese token pertenece a la cuenta, se usa únicamente para consultar proyectos y nunca llega al navegador. La aplicación necesita reconocer a cada persona, mantener sesiones revocables y aplicar permisos propios con independencia de GitLab.

## Decisión

Autenticar con **email y contraseña propios del tablero** y mantener sesiones opacas persistidas por el backend.

- Las contraseñas se derivan con **scrypt** mediante `node:crypto`; el valor guardado incluye la sal y los parámetros necesarios para verificarlo.
- Al iniciar sesión se genera un token aleatorio. El navegador lo recibe en una cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción; la base guarda únicamente su hash SHA-256.
- Cada sesión tiene vencimiento y puede invalidarse al cerrar sesión, cambiar o restablecer la contraseña, o deshabilitar al usuario.
- Las rutas protegidas resuelven la identidad y los permisos en el backend; ocultar controles en el frontend no reemplaza esa validación.
- Los usuarios y las sesiones se persisten en PostgreSQL alojado en Neon, según el [ADR 0009](0009-neon-como-base-de-datos.md). El motor de persistencia es una decisión separada del mecanismo de autenticación.

El [ADR 0007](0007-gestion-de-usuarios.md) amplía esta decisión con registro y administración de usuarios. El modelo y las reglas vigentes, incluida la recuperación de contraseñas, se mantienen en el [dominio de autenticación](../domains/autenticacion.md).

## Alternativas consideradas

- **OAuth con GitLab:** evita custodiar contraseñas y alinea ambas identidades, pero exige registrar una aplicación, implementar el intercambio de tokens y acoplar el acceso al tablero a la disponibilidad y las cuentas de GitLab.
- **Un proveedor externo de identidad:** delega contraseñas y sesiones, pero agrega una dependencia operativa y comercial innecesaria para el alcance actual.
- **JWT sin estado:** evita consultar una sesión persistida, pero dificulta revocar el acceso inmediatamente al cerrar sesión, cambiar una contraseña o deshabilitar un usuario.
- **Sesiones sólo en memoria:** simplifica la persistencia, pero cada reinicio cerraría todas las sesiones y varias instancias no podrían compartirlas.

## Consecuencias

### Positivas

- La sesión puede revocarse desde el servidor y los cambios de estado se aplican sin esperar el vencimiento del token.
- El token de sesión queda fuera del alcance de JavaScript y nunca se almacena en claro en la base.
- La identidad de la aplicación queda separada de las credenciales usadas para consultar GitLab.
- Los permisos y el aislamiento entre cuentas tienen una única barrera en el backend.

### Negativas

- El proyecto custodia contraseñas y debe mantener derivación costosa, límites contra fuerza bruta y recuperación segura.
- Validar una sesión requiere consultar la base; una interrupción de Neon impide autenticar solicitudes y debe responder como indisponibilidad, no como credenciales inválidas.
- La seguridad depende también de configurar HTTPS y cookies seguras en producción.

# ADR 0011: agrupar a los usuarios en cuentas que comparten las credenciales de GitLab

- Estado: aceptada
- Fecha: 2026-09-08

## Contexto

El [ADR 0008](0008-credenciales-de-gitlab-por-usuario.md) puso los proyectos y el access token de GitLab en manos de cada persona. Resolvió sacarlos del `.env`, pero dejó un costo de entrada alto: **cada integrante del equipo tiene que generar su propio PAT, averiguar los IDs de los proyectos y cargarlos** antes de ver un tablero que, en la práctica, es el mismo para todos. Además multiplica las consultas a GitLab —una por persona— para traer exactamente los mismos merge requests.

Lo que el equipo quiere es lo contrario: que lo configure **una sola persona** y que el resto entre a mirar.

## Decisión

Se introduce la **cuenta** como unidad que comparte un tablero. Cada usuario pertenece a exactamente una, y las credenciales de GitLab pasan a ser de la cuenta.

- Tabla `accounts` nueva —`id`, `name`, `invite_code`, `created_at`— y columna `users.account_id` obligatoria.
- `gitlab_settings` se reemplaza por `account_gitlab_settings`, con `account_id` como clave primaria. **Sólo un `admin` de la cuenta** puede escribirla; cualquier miembro puede leerla, porque necesita saber si el tablero ya tiene de dónde alimentarse.
- El **nickname de GitLab pasa a `users`**: es la identidad de cada persona dentro de GitLab y de él depende la [vista personal](../domains/vista-personal.md). Es el único dato de GitLab que sigue cargando cada uno.
- **Quien se registra sin código de invitación crea una cuenta nueva y queda su administrador.** Con código, se suma a esa cuenta con rol `user`. El código lo ve y lo renueva un `admin` desde «Mi cuenta».
- La administración de usuarios queda **acotada a la cuenta** de quien administra. El `username` sigue siendo único en toda la base —el login pide sólo usuario y contraseña, así que no hay con qué desambiguar—, y por eso cada operación comprueba además que el usuario pertenezca a la cuenta.
- La caché del tablero pasa a ser **por cuenta**: una consulta a GitLab alcanza para todo el equipo. Lo único propio de cada persona es `meta.viewerUsername`, que la ruta completa al responder.

El modelo y las reglas se documentan en el [dominio de cuentas](../domains/cuentas.md).

## Alternativas consideradas

- **Dejar las credenciales por persona y sólo permitir copiarlas de un compañero**: no resuelve nada; el token seguiría siendo personal y habría que compartirlo por fuera de la aplicación, que es justamente lo que no se quiere.
- **Una única configuración global, sin cuentas**: alcanzaría para un solo equipo, pero cualquiera que se registre entra a ver ese tablero. Las cuentas cuestan una tabla más y dejan la puerta cerrada por omisión.
- **Invitación por correo con enlace de un uso**: es lo que haría un producto público, pero exige un servicio de correo y una tabla de invitaciones con vencimientos. El código rotable es una columna y resuelve el caso de un equipo interno.
- **Que el registro deje elegir la cuenta de una lista**: la más cómoda y la más abierta: expondría el tablero de cualquier equipo a quien llegue a la URL.
- **Permitir que una persona pertenezca a varias cuentas**: agrega una tabla de pertenencias, un selector de cuenta en toda la interfaz y una sesión con cuenta activa. No hay caso que lo pida todavía.

## Consecuencias

- **Sumar a alguien al tablero deja de requerir credenciales de GitLab**: alcanza con el código de invitación, o con un alta desde la pantalla de usuarios. Ése era el objetivo.
- **Todos los miembros ven exactamente lo mismo**, con los permisos del token de la cuenta. Se pierde la posibilidad de que cada persona siguiera proyectos distintos, que en la práctica nadie usaba: para eso ahora hay que abrir otra cuenta.
- **Menos consultas a GitLab**: la caché compartida hace que el equipo entero cueste una consulta por TTL en lugar de una por persona.
- **Quien tiene el código puede entrar a ver el tablero.** Es el mismo riesgo del registro abierto del [ADR 0007](0007-registro-abierto-y-gestion-de-usuarios.md), acotado a quien recibió el código; renovarlo corta la puerta sin echar a nadie.
- **La migración descarta los token personales.** El esquema conserva el nickname de cada persona y toma como configuración de la cuenta la última que se hubiera guardado; el resto de los token quedaban de más y la tabla vieja se elimina. Los tokens descartados se pueden volver a cargar, y el detalle está en el [dominio de cuentas](../domains/cuentas.md#migración-desde-la-configuración-por-persona).
- **Queda una cuenta vacía cuando se borra a su último miembro.** No molesta —nadie puede entrar a una cuenta sin miembros— y evita borrar en cascada la configuración de un equipo por dar de baja a una persona.

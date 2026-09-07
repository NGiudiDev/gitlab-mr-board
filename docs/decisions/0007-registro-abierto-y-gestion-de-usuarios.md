# ADR 0007: abrir el registro y administrar usuarios desde la interfaz

- Estado: aceptada
- Fecha: 2026-09-06
- Modifica: [ADR 0006](0006-login-local-con-sqlite.md), que dejaba las altas sólo por línea de comandos

## Contexto

El [ADR 0006](0006-login-local-con-sqlite.md) resolvió el login pero dejó el alta de usuarios únicamente en `npm run users`. Eso obliga a tener acceso al servidor para incorporar a cualquier persona y convierte cada alta en una tarea de quien administra la máquina.

## Decisión

Sumar dos caminos en la interfaz, con permisos distintos:

- **Registro abierto**: cualquiera que llegue al tablero puede crear su cuenta desde `POST /api/auth/register`, que además abre la sesión. No permite elegir rol.
- **Administración para admins**: las rutas de `/api/users` exigen rol `admin` y permiten listar, dar de alta con rol, habilitar, deshabilitar y restablecer contraseñas.

Además, **el primer usuario registrado queda administrador**. Sin eso, una instalación nueva no tendría a nadie con permisos para entrar a la pantalla de usuarios sin pasar por la línea de comandos.

Cada persona puede cambiar su propia contraseña con `PUT /api/auth/password`, que exige la actual. La línea de comandos sigue existiendo como camino de recuperación cuando nadie puede entrar.

## Alternativas consideradas

- **Sólo alta por administrador**: conserva el control de acceso, pero exige que un admin esté disponible para cada incorporación.
- **Registro con aprobación**: el alta queda `disabled` hasta que un admin la habilite. Conserva el control de acceso y no depende de la disponibilidad de nadie para el primer paso, a costa de un estado más en el recorrido. Es la evolución natural si hace falta cerrar el acceso.

## Consecuencias

- **El tablero deja de ser cerrado.** Cualquiera que alcance la URL puede crearse una cuenta y ver los merge requests del equipo, incluidos los responsables de cada uno. Es aceptable mientras el tablero no sea accesible desde internet; si se publica, hay que pasar el alta a `disabled` por omisión y habilitarla desde la pantalla de usuarios.
- El registro es una ruta pública que escribe en la base, así que lleva su propio límite: cinco altas por hora y por origen, contadas en memoria del proceso.
- La separación de permisos se valida en el backend, en cada ruta. Esconder los controles en la interfaz es sólo una cortesía: no es la barrera.
- Restablecer la contraseña de otra persona y deshabilitarla son acciones de administrador. Deshabilitarse a sí mismo está impedido, para no dejar el tablero sin ningún admin.

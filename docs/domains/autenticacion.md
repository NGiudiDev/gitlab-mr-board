# Autenticación

El tablero exige una sesión iniciada. Los motivos y las alternativas descartadas están en el [ADR 0006](../decisions/0006-login-local-con-sqlite.md) y el [ADR 0007](../decisions/0007-registro-abierto-y-gestion-de-usuarios.md), el [ADR 0009](../decisions/0009-neon-como-base-de-datos.md) explica por qué la base pasó de SQLite local a Neon y el [ADR 0011](../decisions/0011-cuentas-compartidas.md), por qué los usuarios se agrupan en cuentas; este documento describe el modelo y las reglas.

Cada usuario pertenece a una **cuenta**, que es la que comparte el tablero y sus credenciales de GitLab. Todo lo propio de la cuenta —su nombre, su código de invitación y qué puede cada rol— está en el [dominio de cuentas](cuentas.md).

## Qué queda protegido

| Ruta | Permiso |
|---|---|
| `GET /health` | Público, para que el monitoreo externo siga funcionando |
| `POST /api/auth/register` | Público |
| `POST /api/auth/login` | Público |
| `POST /api/auth/logout` | Público; sin sesión no hace nada y responde 204 |
| `GET /api/auth/me` | Sesión |
| `PUT /api/auth/password` | Sesión |
| `PUT /api/auth/gitlab-username` | Sesión |
| `GET /api/account` | Sesión; el código de invitación sólo vuelve a un `admin` |
| `GET /api/gitlab-settings` | Sesión; siempre sobre la cuenta propia |
| `GET /api/pull-requests` | Sesión |
| `PATCH /api/account` y `POST /api/account/invite-code` | Sesión con rol `admin` |
| `PUT` y `DELETE /api/gitlab-settings` | Sesión con rol `admin` |
| `GET` y `POST /api/users` | Sesión con rol `admin`; sólo alcanzan a la cuenta propia |
| `PATCH /api/users/:username/status` | Sesión con rol `admin`; sólo alcanza a la cuenta propia |

Sin sesión válida, las rutas protegidas responden **HTTP 401** con `{ "error": "Iniciá sesión para ver el tablero." }`. Con sesión pero sin permisos, **HTTP 403**. Sobre un usuario de otra cuenta, **HTTP 404**: para quien administra, ese usuario no existe.

Validar la sesión consulta la base, así que un fallo de esa consulta responde **HTTP 503** y no 401: confundir una base caída con una sesión inválida desloguearía a todo el equipo ante una interrupción pasajera.

La separación de permisos se valida en el backend, ruta por ruta. Que la interfaz esconda un control es una cortesía, no la barrera.

## Modelo de datos

La base Postgres vive en Neon, en la instancia que indica `DATABASE_URL`, y tiene cuatro tablas; las dos de la autenticación son:

- **`users`**: `id`, `account_id`, `username`, `display_name`, `password_hash`, `role`, `status`, `gitlab_username`, `created_at`, `last_login_at`. Las dos marcas temporales son `TIMESTAMPTZ` y el dominio las expone como cadenas ISO.
- **`sessions`**: `id`, `user_id`, `token_hash`, `created_at`, `expires_at`. Se borran en cascada al eliminar el usuario.

Las otras dos, `accounts` y `account_gitlab_settings`, pertenecen al [dominio de cuentas](cuentas.md) y a la [configuración de GitLab](configuracion-gitlab.md).

El esquema se aplica en cada arranque con sentencias `IF NOT EXISTS`, así que no hay una herramienta de migraciones. Los cambios de forma que eso no cubre —como el paso a cuentas— van como sentencias idempotentes en la misma lista.

### Usuario

- El `username` se normaliza a minúsculas y sin espacios: `Ana` y `ana` son la misma persona.
- Debe tener entre 3 y 32 caracteres, y sólo letras, números, punto, guion o guion bajo.
- Es **único en toda la base**, no dentro de la cuenta: el login pide sólo usuario y contraseña, así que no habría con qué desambiguar.
- `account_id` es obligatorio: no hay usuarios sin cuenta.
- `role` vale `user` o `admin`, y siempre **dentro de su cuenta**. Ambos roles ven el mismo tablero; el detalle de qué puede cada uno está en el [dominio de cuentas](cuentas.md#qué-puede-cada-rol).
- `status` vale `active` o `disabled`. Deshabilitar corta el acceso de inmediato, incluso el de las sesiones ya emitidas.

### Nickname de GitLab

- El nombre de usuario de la persona en GitLab, sin la arroba. Se carga en «Mi cuenta», en la tarjeta «Mi identidad en GitLab».
- Es **de cada persona y no de la cuenta**: los proyectos y el access token los carga quien administra, pero con qué nombre aparece cada uno en los merge requests es suyo.
- De él depende la [vista personal](vista-personal.md): sin nickname el tablero no puede saber cuáles de los merge requests son de quien mira. Es nullable, y hasta que se carga la vista personal lo pide.
- Se aceptan letras, números, punto, guion y guion bajo, empezando con letra o número, que es lo que admite GitLab. Hasta 255 caracteres.
- El tablero lo devuelve en `meta.viewerUsername` junto con los merge requests, para no obligar al frontend a pedirlo por separado.
- Guardarlo **no cierra la sesión**: no es una credencial. `PUT /api/auth/gitlab-username` devuelve la identidad actualizada para que el frontend refresque su store.

### Contraseña

- Mínimo 8 caracteres.
- Se guarda derivada con scrypt, con formato `scrypt$N$r$p$sal$clave`. La sal es distinta en cada alta y los parámetros viajan en el propio hash, para poder endurecerlos sin invalidar lo ya guardado.
- La comparación es de tiempo constante. Cuando el usuario no existe igual se deriva una clave descartable, de modo que el tiempo de respuesta no revele qué nombres están dados de alta.
- Cambiar la contraseña cierra todas las sesiones abiertas de esa persona.

### Sesión

- Al ingresar se genera un token aleatorio de 32 bytes. En la base sólo se guarda su hash SHA-256: un volcado del archivo no alcanza para suplantar a nadie.
- Dura `SESSION_DURATION_DAYS` días (7 por omisión) y viaja en la cookie `mr_board_session`, marcada `HttpOnly`, `SameSite=Lax` y `Path=/`. `COOKIE_SECURE` agrega `Secure` donde hay HTTPS.
- Cada ingreso borra de la base las sesiones ya vencidas.
- Una sesión vencida se descarta al primer uso y el frontend vuelve al login avisando que expiró.

### Freno de fuerza bruta

Cinco intentos fallidos seguidos sobre el mismo nombre de usuario bloquean el ingreso durante 15 minutos, con **HTTP 429**. El contador vive en memoria del proceso: se reinicia al reiniciar el backend, y es una defensa contra el ensayo automático, no contra un atacante con acceso al servidor.

## Altas

Hay tres caminos, con permisos distintos:

| Camino | Quién | Cuenta y rol que asigna |
|---|---|---|
| Registro en el tablero | Cualquiera | Con código de invitación, esa cuenta con rol `user`; sin código, una cuenta nueva con rol `admin` |
| Pantalla de usuarios | Sólo `admin` | Su propia cuenta, con el rol que elija |
| `npm run users` | Quien tenga acceso al servidor | La de `--invite`, o una nueva con `--account` |

El registro abre la sesión en el mismo paso: quien se acaba de dar de alta ya probó quién es. Es una ruta pública que escribe en la base, así que tiene su propio freno: **cinco altas por hora y por origen**, contadas en memoria del proceso.

Que quien abre una cuenta quede su administrador es lo que permite que un equipo empiece a usar el tablero sin pasar por la línea de comandos. El detalle de cada camino está en el [dominio de cuentas](cuentas.md#cómo-se-entra-a-una-cuenta).

::: warning El tablero no es cerrado
Con el registro abierto, cualquiera que alcance la URL puede crearse una cuenta. Sólo ve un tablero vacío hasta que configure GitLab, y **no llega al de ningún equipo sin su código de invitación**. Para cerrarlo del todo, el cambio es dar de alta con `status: 'disabled'` y habilitar desde la pantalla de usuarios.
:::

## Pantallas de configuración

La barra superior navega entre el tablero y la configuración de la cuenta:

- **«Mi cuenta»**, para cualquier usuario, reúne cuatro tarjetas: el equipo y su invitación ([cuentas](cuentas.md#pantalla-mi-equipo)), la configuración de GitLab de la cuenta ([configuración de GitLab](configuracion-gitlab.md)), el nickname propio de GitLab y el cambio de la propia contraseña indicando la actual como confirmación. Al cambiar la contraseña se cierran todas sus sesiones y la app vuelve al ingreso.
- **«Usuarios»**, sólo para un `admin`, lista **los usuarios de su cuenta** con su rol, estado y último ingreso, y permite dar de alta, habilitar y deshabilitar. Restablecer una contraseña ajena quedó fuera de la interfaz: se hace con `npm run users -- password <usuario>`.

Deshabilitar la propia cuenta está impedido: dejaría a la cuenta sin ningún administrador si es el único, y en cualquier caso cerraría la sesión en curso.

## Gestión por línea de comandos

La línea de comandos sigue siendo el camino de recuperación cuando nadie puede entrar.

```bash
npm run users --prefix backend -- create ana --name "Ana Pérez" --account "Mi equipo"
```

| Subcomando | Efecto |
|---|---|
| `create <usuario> [--name "Nombre"] [--account "Cuenta"]` | Abre una cuenta nueva y deja al usuario como su administrador |
| `create <usuario> --invite <código> [--name "Nombre"] [--role admin]` | Suma al usuario a la cuenta de ese código |
| `password <usuario>` | Cambia la contraseña y cierra sus sesiones |
| `disable <usuario>` | Corta el acceso, incluidas las sesiones abiertas |
| `enable <usuario>` | Vuelve a habilitarlo |
| `delete <usuario>` | Lo borra junto con sus sesiones; no falla si no existe |
| `list` | Lista usuario, rol, estado, cuenta y nombre visible de toda la base |
| `accounts` | Lista las cuentas con su código de invitación y cuánta gente las integra |

`accounts` es el camino para recuperar un código de invitación cuando no queda nadie que pueda entrar a verlo. Borrar es la única operación que quita datos de forma irreversible; la interfaz no la ofrece, porque para cortar el acceso alcanza con deshabilitar, que además conserva el historial. Borrar al último miembro de una cuenta la deja vacía: nadie puede entrar a ella, y su configuración de GitLab queda intacta por si se suma alguien con el código.

La contraseña nunca se pasa por argumento: se pide por teclado, no se muestra al escribirla y se confirma dos veces. Así no queda en el historial de la terminal ni en la lista de procesos.

El script usa la misma configuración que el backend, así que necesita un `backend/.env` válido.

## Recorrido en el frontend

El estado de la sesión vive en el store `features/auth/hooks/useSession.js`, con el mismo patrón que el del tablero:

1. Al abrir la app se consulta `GET /api/auth/me`. Mientras tanto se muestra «Verificando tu sesión...», para no hacer parpadear el formulario.
2. Sin sesión se presenta `LoginForm`, que ofrece cambiar a `RegisterForm`; ese formulario elige entre sumarse a un equipo con su código o abrir uno nuevo. Con sesión, el tablero, que recién se monta autenticado para que el polling no dispare peticiones que el backend vaya a rechazar.
3. `AccountMenu` reúne detrás de un avatar quién está conectado, su usuario, el equipo y la acción para cerrar sesión; al cerrarla se descartan también los datos del tablero y de la cuenta. La barra del layout navega entre el tablero, la cuenta y `UserAdmin`, según la [arquitectura del frontend](../architecture/frontend.md#navegación-entre-secciones).
4. Si el tablero recibe un 401, el store da la sesión por terminada y la app vuelve al login con el aviso correspondiente.

La lista de usuarios es lo único que no vive en un store compartido: la consume una sola pantalla, así que `useUsers` la mantiene en estado local.

Todas las peticiones al backend usan `credentials: 'include'`: la cookie es `HttpOnly` y, en desarrollo, el backend está en otro puerto.

# Cuentas

La **cuenta** es el grupo de personas que comparte un tablero. Sus proyectos y su access token de GitLab se cargan una sola vez y alimentan el tablero de todos sus miembros: quien se suma no configura nada de GitLab. Los motivos y las alternativas descartadas están en el [ADR 0011](../decisions/0011-cuentas-compartidas.md); este documento describe el modelo y las reglas.

Cada usuario pertenece a **exactamente una** cuenta, y no hay forma de cambiarse: para mirar el tablero de otro equipo hay que tener un usuario en ese equipo.

## Modelo de datos

En la misma base Postgres de la [autenticación](autenticacion.md):

- **`accounts`**: `id`, `name`, `invite_code` (único), `created_at`.
- **`users.account_id`**: clave foránea obligatoria a `accounts`. Borrar una cuenta arrastra sus usuarios, y con ellos sus sesiones.
- **`account_gitlab_settings`**: la [configuración de GitLab](configuracion-gitlab.md) de la cuenta.

El `username` sigue siendo **único en toda la base** y no dentro de la cuenta: el login pide sólo usuario y contraseña, así que no habría con qué desambiguar dos personas con el mismo nombre en cuentas distintas.

### Nombre

- Opcional al crear la cuenta: sin nombre queda «Mi equipo», y un `admin` lo cambia después desde «Mi cuenta».
- Hasta 80 caracteres. Se recorta el espacio de los extremos.
- No es único: dos equipos distintos pueden llamarse igual sin que se confundan, porque nadie llega a una cuenta por su nombre.

### Código de invitación

- Diez caracteres de un alfabeto sin ambigüedades —sin `O`, `0`, `I`, `L` ni `1`—, generados con el generador criptográfico del sistema: el código es lo único que hace falta para sumarse, así que no puede ser predecible.
- Se compara sin distinguir mayúsculas y descartando espacios y guiones, porque se copia y se pega a mano.
- **Sólo lo ve un `admin`.** A los demás, `GET /api/account` les devuelve `inviteCode: null`.
- Renovarlo deja sin efecto el anterior. Quien ya se sumó no pierde el acceso: la pertenencia queda en su usuario, no en el código.

::: warning El código abre el tablero
Quien tenga el código puede registrarse y ver los merge requests del equipo. Es el mismo riesgo del registro abierto ([ADR 0007](../decisions/0007-registro-abierto-y-gestion-de-usuarios.md)), acotado a quien lo recibió. Ante una filtración, renovarlo alcanza para cerrar la puerta.
:::

## Cómo se entra a una cuenta

| Camino | Quién | Cuenta | Rol |
|---|---|---|---|
| Registro sin código | Cualquiera | Una nueva, con el nombre que elija | `admin` |
| Registro con código | Quien tenga el código | La del código | `user` |
| Pantalla de usuarios | Un `admin` | La suya, sin poder elegir otra | El que elija |
| `npm run users -- create` | Quien tenga acceso al servidor | Una nueva, o la de `--invite` | `admin`, o el de `--role` |

Que quien abre una cuenta quede su administrador es lo que permite que un equipo empiece a usar el tablero sin intervención de nadie. El alta valida el usuario y la contraseña **antes** de crear la cuenta, para que un nombre repetido no deje una cuenta sin nadie adentro.

## Qué puede cada rol

| Operación | `user` | `admin` |
|---|:--:|:--:|
| Ver el tablero de la cuenta | Sí | Sí |
| Cargar su propio nickname de GitLab | Sí | Sí |
| Cambiar su propia contraseña | Sí | Sí |
| Ver el nombre de la cuenta y cuánta gente la integra | Sí | Sí |
| Ver la configuración de GitLab de la cuenta | Sí | Sí |
| **Cargar o borrar** la configuración de GitLab | No | Sí |
| Ver y renovar el código de invitación | No | Sí |
| Cambiar el nombre de la cuenta | No | Sí |
| Administrar los usuarios de la cuenta | No | Sí |
| Elegir en la vista personal a quién mirar | No | Sí |

Los permisos se validan en el backend ruta por ruta. Que la interfaz esconda un control es una cortesía, no la barrera.

## Aislamiento entre cuentas

Ninguna operación alcanza a otra cuenta:

- El tablero se arma con las credenciales de la cuenta de la sesión, y su caché es por cuenta.
- La pantalla de usuarios lista y da de alta sólo dentro de la cuenta de quien administra.
- Habilitar o deshabilitar a alguien de otra cuenta responde **404**, no 403: para quien administra, ese usuario no existe.
- La configuración de GitLab se lee y se escribe siempre por `account_id`, tomado de la sesión y nunca del cuerpo de la petición.

## Endpoints

| Ruta | Permiso | Uso |
|---|---|---|
| `GET /api/account` | Sesión | Devuelve `{ account }` con `id`, `name`, `createdAt`, `memberCount` y `inviteCode` —este último sólo para un `admin`, y `null` para el resto | 
| `PATCH /api/account` | `admin` | Recibe `{ name }` y devuelve la cuenta actualizada |
| `POST /api/account/invite-code` | `admin` | Genera un código nuevo, deja sin efecto el anterior y devuelve la cuenta |

Los datos inválidos responden **HTTP 400** con el motivo en español; una cuenta inexistente, **404**.

## Migración desde la configuración por persona

El esquema se aplica en cada arranque, así que la migración corre sola la primera vez ([ADR 0009](../decisions/0009-neon-como-base-de-datos.md)):

1. Si hay usuarios sin cuenta, se crea **una sola** llamada «Mi equipo» y se los suma a todos: ya eran un equipo que miraba el mismo tablero.
2. El `gitlab_username` de cada persona pasa de su vieja configuración a su usuario.
3. La configuración de GitLab **guardada más recientemente** pasa a ser la de la cuenta.
4. Se elimina la tabla `gitlab_settings`. Los demás access token quedaban de más —ahora hay uno por cuenta— y no tiene sentido conservarlos cifrados sin que nada los use.

El paso 4 descarta datos, así que conviene saberlo antes del primer arranque: si la configuración que tiene que quedar no es la última guardada, alcanza con que quien corresponda guarde la suya de nuevo justo antes de actualizar. Después del cambio, cualquier `admin` la puede volver a cargar desde «Mi cuenta».

Un arranque posterior no repite nada: ya no quedan usuarios sin cuenta ni tabla vieja que leer.

## Pantalla «Mi equipo»

Vive en la sección «Mi cuenta», arriba de todo, y presenta el nombre de la cuenta y cuánta gente la integra. A un `admin` le agrega el campo para renombrarla y el código de invitación, en un campo de sólo lectura para poder copiarlo, con el botón que lo renueva.

Su store es `features/accounts/hooks/useAccount.js`, con el mismo patrón que la sesión y el tablero: la cuenta la miran dos lugares —la barra superior y esta pantalla—, así que no puede ser estado local de un componente. Se recarga cuando el `accountId` de la sesión deja de coincidir con la cuenta que hay en el store, que es lo que pasa al entrar con otro usuario.

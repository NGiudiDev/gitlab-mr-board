# Cuentas

Una cuenta representa al equipo que comparte un tablero, una configuración de GitLab y una caché. Cada usuario pertenece a exactamente una cuenta.

El [ADR 0008](../decisions/0008-cuentas-compartidas.md) explica la decisión; esta página define las reglas vigentes.

## Modelo

`accounts` guarda `id`, `name`, `invite_code` y `created_at`. `users.account_id` es una clave foránea obligatoria y la [configuración de GitLab](configuracion-gitlab.md) usa el mismo identificador.

El nombre se recorta, admite hasta 80 caracteres y usa «Mi equipo» cuando no se informa. No necesita ser único.

## Código de invitación

- Tiene diez caracteres generados criptográficamente con un alfabeto sin símbolos ambiguos.
- Se compara sin distinguir mayúsculas y después de quitar espacios y guiones.
- Sólo un `admin` puede verlo o renovarlo.
- Renovarlo invalida el código anterior, pero no afecta a quienes ya pertenecen a la cuenta.

Quien posee el código puede registrarse y acceder al tablero del equipo. Debe tratarse como un secreto compartido y renovarse ante una filtración.

## Cómo se entra a una cuenta

| Camino | Cuenta resultante | Rol |
|---|---|---|
| Registro sin código | Crea una cuenta nueva. | `admin` |
| Registro con código | Se une a la cuenta invitante. | `user` |
| Alta desde Usuarios | Usa la cuenta del administrador. | Rol elegido por el admin |
| CLI con `--account` o `--invite` | Crea una cuenta o usa la invitación. | Según el comando |

El email y la contraseña se validan antes de crear una cuenta para no dejar cuentas vacías ante un alta inválida.

## Qué puede cada rol

| Operación | `user` | `admin` |
|---|:---:|:---:|
| Ver el tablero y la cuenta | Sí | Sí |
| Editar sus datos personales | Sí | Sí |
| Ver la configuración de GitLab | Sí | Sí |
| Editar cuenta, invitación o configuración de GitLab | No | Sí |
| Administrar integrantes | No | Sí |
| Elegir otra persona en la vista personal | No | Sí |

Los permisos se validan en el backend. La visibilidad de los controles en el frontend no es una barrera de acceso.

## Aislamiento

El `accountId` siempre se obtiene de la sesión, nunca del cuerpo de una petición.

- El tablero y su caché usan las credenciales de esa cuenta.
- La administración de usuarios sólo alcanza a sus integrantes.
- La configuración de GitLab se lee y escribe por cuenta.
- Intentar operar sobre un usuario de otra cuenta responde 404.

## Endpoints

| Ruta | Acceso | Uso |
|---|---|---|
| `GET /api/account` | Sesión | Devuelve nombre, fecha, cantidad de integrantes y el código sólo para admin. |
| `PATCH /api/account` | Admin | Cambia el nombre. |
| `POST /api/account/invite-code` | Admin | Renueva el código de invitación. |

Los datos personales y la administración de integrantes pertenecen a [Autenticación](autenticacion.md).

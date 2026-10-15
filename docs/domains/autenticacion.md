# Autenticación

Este dominio define la identidad local, las credenciales, las sesiones y el ciclo de vida de los usuarios. Cada usuario pertenece a una cuenta; invitaciones, roles y aislamiento se definen en [Cuentas](cuentas.md).

Los motivos de la solución están en el [ADR 0005](../decisions/0005-autenticacion-local-con-sesiones.md) y el [ADR 0006](../decisions/0006-gestion-de-usuarios.md).

## Usuario

| Dato | Regla |
|---|---|
| Email | Se normaliza a minúsculas, admite hasta 254 caracteres y es único en toda la base. |
| Nombre visible | Se recorta; si queda vacío, usa el email. |
| Cuenta | Es obligatoria e inmutable para ese usuario. |
| Rol | `user` o `admin`, siempre dentro de la cuenta. |
| Estado | `active` o `disabled`; deshabilitar invalida todas las sesiones. |
| Último ingreso | Se actualiza al crear una sesión. |

La API nunca devuelve `password_hash`, hashes de tokens ni el token de sesión.

### Nickname de GitLab

El nickname identifica a la persona dentro de GitLab y pertenece al usuario, no a la cuenta. Admite letras, números, punto, guion y guion bajo, debe comenzar con una letra o un número y puede tener hasta 255 caracteres.

Es opcional, pero la [vista personal](vista-personal.md) lo necesita para reconocer a quien consulta. El tablero lo publica como `meta.viewerUsername`; actualizarlo no cierra la sesión.

## Contraseñas

- Deben tener al menos 8 caracteres.
- Se derivan con scrypt y una sal aleatoria; nunca se guardan ni registran en claro.
- La comparación usa tiempo constante. Un email inexistente ejecuta igualmente una derivación descartable para no revelar usuarios por tiempo de respuesta.
- Cambiar o restablecer la contraseña invalida todas las sesiones y enlaces pendientes de la persona.

La recuperación sin sesión usa un token aleatorio de un solo uso. La base conserva únicamente su hash SHA-256 y su vencimiento, definido por `PASSWORD_RESET_DURATION_MINUTES`. La respuesta a la solicitud es la misma exista o no un usuario activo con ese email.

En producción Nodemailer envía el enlace por SMTP; en desarrollo lo escribe en la terminal.

## Sesiones

Cada ingreso genera un token aleatorio de 32 bytes. La base guarda sólo su hash SHA-256 y el navegador recibe el valor en la cookie `mr_board_session`, con `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` cuando corresponde.

La duración se configura con `SESSION_DURATION_DAYS`. Una sesión vencida o perteneciente a un usuario deshabilitado no autentica y se elimina cuando corresponde.

## Límites de acceso

| Operación | Límite | Alcance |
|---|---|---|
| Login fallido | Cinco intentos; bloqueo de 15 minutos. | Por email y proceso. |
| Registro público | Cinco altas por hora. | Por origen y proceso. |
| Solicitud de recuperación | Cinco pedidos por hora. | Por origen y proceso. |

Estos contadores viven en memoria y se reinician con el proceso.

## Alta y gestión

El registro puede crear una cuenta nueva o usar un código para sumarse a una existente. La matriz completa está en [Cómo se entra a una cuenta](cuentas.md#cómo-se-entra-a-una-cuenta).

Un `admin` puede listar, crear, habilitar y deshabilitar usuarios de su propia cuenta. No puede operar sobre otra cuenta ni cambiar su propio estado. Deshabilitar a una persona corta inmediatamente todas sus sesiones.

Cada persona puede editar su email, nombre visible, nickname de GitLab y contraseña. Un administrador no puede establecer la contraseña de otra persona desde la API.

## Endpoints

| Ruta | Acceso | Uso |
|---|---|---|
| `POST /api/auth/register` | Público | Crea el usuario y abre una sesión. |
| `POST /api/auth/login` | Público | Valida credenciales y abre una sesión. |
| `POST /api/auth/password-reset-requests` | Público | Solicita un enlace de recuperación. |
| `POST /api/auth/password-resets` | Público | Consume el enlace y cambia la contraseña. |
| `POST /api/auth/logout` | Público | Invalida la sesión si existe y limpia la cookie. |
| `GET /api/auth/me` | Sesión | Devuelve la identidad vigente. |
| `PUT /api/auth/password` | Sesión | Cambia la contraseña propia. |
| `PATCH /api/users/me/profile` | Sesión | Cambia email y nombre visible propios. |
| `PUT /api/users/me/gitlab-username` | Sesión | Cambia el nickname propio. |
| `GET`, `POST /api/users` | Admin | Lista o crea usuarios de la cuenta. |
| `PATCH /api/users/:email/status` | Admin | Habilita o deshabilita un integrante. |

Una ruta protegida responde 401 sin sesión y 403 sin rol suficiente. Un usuario de otra cuenta responde 404 para no revelar su existencia. Si falla la base al validar la sesión, responde 503 y no invalida las credenciales.

## Gestión por línea de comandos

El script operativo usa la misma configuración del backend y solicita las contraseñas por teclado.

| Subcomando | Efecto |
|---|---|
| `create <email> --account <nombre>` | Crea una cuenta y su administrador. |
| `create <email> --invite <código> [--role admin]` | Agrega un usuario a una cuenta existente. |
| `password <email>` | Cambia la contraseña e invalida sesiones. |
| `disable <email>` / `enable <email>` | Cambia el estado del usuario. |
| `delete <email>` | Elimina el usuario y sus sesiones. |
| `list` | Lista los usuarios de la base. |
| `accounts` | Lista cuentas, invitaciones y cantidad de integrantes. |

Ejemplo:

```bash
npm run users --prefix backend -- create ana@example.com --name "Ana Pérez" --account "Mi equipo"
```

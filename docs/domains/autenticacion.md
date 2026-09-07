# Autenticación

El tablero exige una sesión iniciada. Los motivos y las alternativas descartadas están en el [ADR 0006](../decisions/0006-login-local-con-sqlite.md) y el [ADR 0007](../decisions/0007-registro-abierto-y-gestion-de-usuarios.md); este documento describe el modelo y las reglas.

## Qué queda protegido

| Ruta | Permiso |
|---|---|
| `GET /health` | Público, para que el monitoreo externo siga funcionando |
| `POST /api/auth/register` | Público |
| `POST /api/auth/login` | Público |
| `POST /api/auth/logout` | Público; sin sesión no hace nada y responde 204 |
| `GET /api/auth/me` | Sesión |
| `PUT /api/auth/password` | Sesión |
| `GET /api/pull-requests` | Sesión |
| `GET` y `POST /api/users` | Sesión con rol `admin` |
| `PATCH /api/users/:username/status` | Sesión con rol `admin` |
| `PUT /api/users/:username/password` | Sesión con rol `admin` |

Sin sesión válida, las rutas protegidas responden **HTTP 401** con `{ "error": "Iniciá sesión para ver el tablero." }`. Con sesión pero sin permisos, **HTTP 403**.

La separación de permisos se valida en el backend, ruta por ruta. Que la interfaz esconda un control es una cortesía, no la barrera.

## Modelo de datos

La base SQLite vive en `DATABASE_PATH` (por omisión `backend/data/app.db`) y tiene dos tablas:

- **`users`**: `id`, `username`, `display_name`, `password_hash`, `role`, `status`, `created_at`, `last_login_at`.
- **`sessions`**: `id`, `user_id`, `token_hash`, `created_at`, `expires_at`. Se borran en cascada al eliminar el usuario.

El esquema se aplica en cada arranque con sentencias `IF NOT EXISTS`, así que no hay una herramienta de migraciones.

### Usuario

- El `username` se normaliza a minúsculas y sin espacios: `Ana` y `ana` son la misma persona.
- Debe tener entre 3 y 32 caracteres, y sólo letras, números, punto, guion o guion bajo.
- `role` vale `user` o `admin`. Sólo un `admin` puede administrar usuarios; ambos roles ven el mismo tablero.
- `status` vale `active` o `disabled`. Deshabilitar corta el acceso de inmediato, incluso el de las sesiones ya emitidas.

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

| Camino | Quién | Rol que asigna |
|---|---|---|
| Registro en el tablero | Cualquiera | `admin` si es el primer usuario del sistema, `user` en adelante |
| Pantalla de usuarios | Sólo `admin` | El que elija quien administra |
| `npm run users` | Quien tenga acceso al servidor | El que indique `--role` |

El registro abre la sesión en el mismo paso: quien se acaba de dar de alta ya probó quién es. Es una ruta pública que escribe en la base, así que tiene su propio freno: **cinco altas por hora y por origen**, contadas en memoria del proceso.

Que el primer registro quede administrador es lo que permite que una instalación nueva se administre sola, sin pasar por la línea de comandos.

::: warning El tablero no es cerrado
Con el registro abierto, cualquiera que alcance la URL puede crearse una cuenta y ver los merge requests del equipo. Es aceptable mientras el tablero no esté publicado en internet. Para cerrarlo, el cambio es dar de alta con `status: 'disabled'` y habilitar desde la pantalla de usuarios.
:::

## Pantallas de configuración

La barra superior navega entre el tablero y la configuración de la cuenta:

- **«Mi cuenta»**, para cualquier usuario, cambia la propia contraseña indicando la actual como confirmación. Al aplicarse se cierran todas sus sesiones y la app vuelve al ingreso.
- **«Usuarios»**, sólo para un `admin`, lista los usuarios con su rol, estado y último ingreso, y permite dar de alta, habilitar, deshabilitar y restablecer contraseñas.

Deshabilitar la propia cuenta está impedido: dejaría el tablero sin ningún administrador si es el único, y en cualquier caso cerraría la sesión en curso.

## Gestión por línea de comandos

La línea de comandos sigue siendo el camino de recuperación cuando nadie puede entrar.

```bash
npm run users --prefix backend -- create ana --name "Ana Pérez" --role admin
```

| Subcomando | Efecto |
|---|---|
| `create <usuario> [--name "Nombre"] [--role admin]` | Da de alta un usuario activo |
| `password <usuario>` | Cambia la contraseña y cierra sus sesiones |
| `disable <usuario>` | Corta el acceso, incluidas las sesiones abiertas |
| `enable <usuario>` | Vuelve a habilitarlo |
| `list` | Lista usuario, rol, estado y nombre visible |

La contraseña nunca se pasa por argumento: se pide por teclado, no se muestra al escribirla y se confirma dos veces. Así no queda en el historial de la terminal ni en la lista de procesos.

El script usa la misma configuración que el backend, así que necesita un `backend/.env` válido.

## Recorrido en el frontend

El estado de la sesión vive en el store `features/auth/hooks/useSession.js`, con el mismo patrón que el del tablero:

1. Al abrir la app se consulta `GET /api/auth/me`. Mientras tanto se muestra «Verificando tu sesión...», para no hacer parpadear el formulario.
2. Sin sesión se presenta `LoginForm`, que ofrece cambiar a `RegisterForm`. Con sesión, el tablero. El tablero recién se monta autenticado, así que el polling no dispara peticiones que el backend vaya a rechazar.
3. `SessionBar` muestra quién está conectado y ofrece cerrar sesión; al cerrarla se descartan también los datos del tablero. La barra del layout navega entre el tablero, `AccountPanel` y `UserAdmin`, según la [arquitectura del frontend](../architecture/frontend.md#navegación-entre-secciones).
4. Si el tablero recibe un 401, el store da la sesión por terminada y la app vuelve al login con el aviso correspondiente.

La lista de usuarios es lo único que no vive en un store compartido: la consume una sola pantalla, así que `useUsers` la mantiene en estado local.

Todas las peticiones al backend usan `credentials: 'include'`: la cookie es `HttpOnly` y, en desarrollo, el backend está en otro puerto.

# Arquitectura del frontend

El frontend es una aplicación de página única construida con React 19, Vite y styled-components. Consume exclusivamente el contrato del backend: no accede a GitLab, no recibe secretos y no vuelve a calcular reglas de negocio.

## Responsabilidades

- Resolver rutas públicas y privadas según la sesión.
- Presentar el tablero, la cuenta, el perfil y la administración de usuarios.
- Agrupar, ordenar, formatear y filtrar campos ya calculados por el backend.
- Mantener estado compartido de sesión, cuenta y merge requests.
- Comunicar carga, errores y cambios asíncronos de forma accesible.
- Reportar errores globales y de React a Sentry sin enviar PII.

## Organización del código

```text
src/
  main.jsx
  config.js
  app/                 layout, rutas, estilos compartidos y reporte de errores
    components/
    constants/
    utils/
  design_system/       controles visuales sin dominio, usados por varias features
    masked_field/
    visibility_icon/
  features/
    accounts/
    api/
    auth/
    gitlabAccount/
    mergeRequests/
    users/
```

Cada funcionalidad usa `components/`, `hooks/`, `pages/`, `constants/` y `utils/` sólo cuando los necesita. Cada componente o page vive en una carpeta `snake_case` junto con sus estilos exclusivos y sus test.

Un archivo de componente define únicamente el componente que exporta: sus funciones auxiliares viven en `utils/` y sus valores fijos en `constants/`, dentro de la misma feature. Cuando un componente acumula más de una responsabilidad se parte en componentes hermanos, y el estado que coordina varias piezas se extrae a un hook de la feature.

`app/` se reserva para composición general. `design_system/` guarda los controles que no conocen ningún dominio y que varias features comparten, como `MaskedField` y su icono: no importan features ni stores, sólo los tokens y las primitivas visuales de `app/`. Las reglas específicas pertenecen a su feature y las reglas de dominio llegan resueltas desde el backend.

## Dirección de dependencias

- `main.jsx` monta React, el router y los estilos globales.
- `app/utils/error_reporting.utils.js` inicia Sentry y conecta los callbacks de errores de React 19.
- `app/` importa pages y stores para resolver layout, rutas y sesión.
- Las pages coordinan features cuando una pantalla reúne más de un dominio.
- Los componentes dependen de su feature, de las primitivas visuales de `app/` y de los controles de `design_system/`.
- Los hooks encapsulan acceso remoto y estado de su feature.
- Los archivos `.style.js` sólo contienen presentación.

No se usan barrels. Una necesidad compartida se mueve a `app/` sólo cuando más de una feature la utiliza.

## Navegación entre secciones

React Router mantiene una URL por pantalla:

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login`, `/register` | Ingreso y alta. | Sin sesión |
| `/forgot-password`, `/reset-password` | Recuperación de contraseña. | Sin sesión |
| `/board` | Tablero general o personal. | Sesión |
| `/profile` | Perfil y contraseña propios. | Sesión |
| `/account` | Cuenta, invitación y configuración de GitLab. | Sesión |
| `/users` | Gestión de integrantes. | Admin |

`routes.consts.js` define `APP_PATHS` y `NAVIGATION_SECTIONS`. `App` asocia cada URL con una page; `AppLayout` presenta la navegación; `LoggedUserMenu` abre «Mi perfil», «Mi cuenta» y el cierre de sesión.

Las restricciones visibles mejoran el recorrido, pero el backend sigue siendo la barrera de permisos.

## Composición

```text
App
└── AppLayout
    ├── GuestRoutes → LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
    └── AuthenticatedRoutes
        ├── BoardPage
        │   ├── ViewControls
        │   ├── TopBar → TopBarStatus
        │   └── MrBoard → ProjectGroup → BoardColumn → MrCard → MrDetailModal
        ├── AccountPage
        ├── ProfilePage
        └── UsersPage → UserAdmin → CreateUserForm, UsersTable
```

`App` elige entre las rutas con sesión y las de ingreso; cada grupo de rutas vive en su propio componente de `app/components/`. Las pages componen pantallas; los componentes reciben props explícitas y comunican acciones mediante callbacks. `MrBoard` conserva localmente qué proyectos están expandidos y presenta los merge requests que recibe sin reinterpretar su clasificación o sus responsables; `MrBlockers` reúne los cuatro badges que comparten la tarjeta y el detalle.

## Estado compartido

Los stores usan `useSyncExternalStore` y viven a nivel de módulo:

| Store | Conserva |
|---|---|
| `useSession` | Usuario y estado de autenticación. |
| `useAccount` | Cuenta compartida e invitación visible. |
| `useMergeRequests` | Tablero, metadatos, carga, errores, vista y persona seleccionada. |

El primer consumidor del tablero inicia la carga y el polling; el último en desmontarse detiene el intervalo. Los efectos son idempotentes porque `StrictMode` los ejecuta dos veces durante el desarrollo. Al cerrar sesión se reinician los tres stores: de eso se ocupa `features/auth/hooks/useLogout.js`, el único lugar que conoce ese orden.

`useState` queda para estado local, como campos de formulario, menús, modales y proyectos expandidos.

## Acceso al backend

Cada petición usa `credentials: "include"`. La URL se obtiene de `VITE_API_BASE_URL`; durante el desarrollo usa `http://localhost:3001` y en producción puede usar el mismo origen mediante el rewrite de Vercel.

- Un 401 invalida la sesión.
- Un 409 `gitlab_settings_missing` presenta una guía para configurar la cuenta.
- El polling reutiliza la caché del backend; la actualización manual envía `force=true`.
- Un error de actualización conserva los datos anteriores y se comunica sin ocultar el tablero.
- Guardar una fecha de subida actualiza el store sólo después de una respuesta satisfactoria.

## Interfaz visual

styled-components mantiene los estilos exclusivos junto a cada componente. `app.styles.jsx` contiene tokens, reset, estilos globales y primitivas compartidas; `styles.consts.js`, los mixins reutilizables.

El layout usa una barra superior `sticky` y un único `main`. El tablero agrupa los proyectos verticalmente; al expandir uno, sus columnas se desplazan dentro del contenedor de `MrBoard`, sin generar scroll horizontal en la página. Cada columna conserva su propio scroll vertical.

Los colores representan estados semánticos, pero nunca son la única señal: badges y alertas combinan texto, iconos y contraste. Todo cambio visual se revisa en tema oscuro y en estados de carga, error y vacío.

## Estados y accesibilidad

`BoardPage` distingue carga inicial, falta de configuración, vacío, error sin datos, datos disponibles, actualización en segundo plano y estados vacíos de la vista personal.

La interfaz apunta a WCAG 2.2 nivel AA:

- HTML semántico, un único `main` y jerarquía de encabezados.
- Navegación completa por teclado y foco visible.
- Regiones vivas para cargas, errores y resultados asíncronos.
- Controles con nombre accesible y estados mediante `aria-*`.
- Modales con foco contenido, cierre con `Escape` y retorno al disparador.
- Contraste mínimo y reducción de animaciones con `prefers-reduced-motion`.

Las reglas funcionales de cada pantalla se mantienen en [Dominios](../domains/) y la validación automatizada y manual, en [Test](../development/test.md).

El alcance y la privacidad de los reportes se detallan en [Observabilidad](observabilidad.md).

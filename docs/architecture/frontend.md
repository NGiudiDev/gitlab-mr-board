# Arquitectura del frontend

El frontend es una aplicación de página única construida con React 19, Vite y Tailwind CSS, según el [ADR 0005](../decisions/0005-frontend-en-react.md). Consume exclusivamente el contrato consolidado del backend; no accede directamente a GitLab ni conoce su token.

La lógica de negocio vive en el backend. El frontend presenta lo que recibe resuelto —clasificación, responsables y personas— y sólo conserva decisiones de presentación: qué columnas mostrar y en qué orden, agrupar, ordenar visualmente, formatear y filtrar por lo que ya viene calculado.

La aplicación usa componentes de función en archivos `.jsx`, módulos ES, React Router en modo declarativo y estado compartido basado en las primitivas nativas de React. No incorpora un provider global ni una biblioteca externa de gestión de estado.

## Organización del código

El código se divide entre la composición general y las funcionalidades del dominio:

- `src/main.jsx`: carga los estilos globales y monta React mediante `createRoot`, `StrictMode` y `BrowserRouter`.
- `src/config.js`: centraliza y valida la configuración expuesta por Vite.
- `src/app/App.jsx`: decide si mostrar las rutas públicas o privadas según la sesión y resuelve qué presentar durante la carga, los errores y la ausencia de datos.
- `src/app/AppShell.jsx`: define el layout —barra superior, navegación entre secciones y contenido—; `AccountMenu.jsx` reúne allí la identidad, el equipo y el cierre de sesión.
- `src/app/routes.js`: mantiene las URLs y los metadatos de navegación como única fuente de verdad.
- `src/features/accounts/`: contiene el store de la cuenta y el panel que la presenta, descritos en el [dominio de cuentas](../domains/cuentas.md).
- `src/features/auth/`: contiene el store de la sesión, el hook de la lista de usuarios y los componentes de ingreso, alta, administración, perfil y contraseña, descritos en el [dominio de autenticación](../domains/autenticacion.md).
- `src/features/gitlabAccount/`: contiene la sección, el formulario, los estados de carga y lectura, y el hook de la configuración de GitLab de la cuenta, descritos en la [configuración de GitLab](../domains/configuracion-gitlab.md).
- `src/features/gitlabUser/`: contiene la configuración del nickname de GitLab propio de cada persona.
- `src/features/mergeRequests/hooks/useMergeRequests.js`: contiene el store compartido, el acceso al backend y el polling.
- `src/features/mergeRequests/components/`: contiene los componentes del tablero de merge requests.
- `src/features/mergeRequests/personalView.js`: selecciona los datos de la vista personal a partir del contrato del backend.
- `src/assets/main.css`: incluye las directivas de Tailwind y los pocos estilos globales que no se expresan mediante utilidades.
- `test/`: reúne la configuración, los fixtures y las utilidades compartidas según la [estrategia de test](../development/test.md).

Las funcionalidades nuevas deben seguir la estructura `src/features/<feature>/components/` y `src/features/<feature>/hooks/`. `src/app/` se reserva para la composición de alto nivel y no debe absorber lógica propia de una feature.

## Composición de componentes

`App` consume `useSession()`, monta el tablero sólo con la sesión abierta y resuelve las rutas públicas o privadas; `AppShell` aporta el layout y la navegación; `Board` consume `useMergeRequests()` y distribuye datos y callbacks mediante props explícitas. El árbol principal es:

```text
App
└── AppShell
    ├── AccountMenu                  (con sesión)
    ├── LoginForm / RegisterForm     (sin sesión)
    ├── Board                        (sección «Tablero»)
    │   ├── ViewControls
    │   ├── TopBar
    │   └── MrBoard
    │       └── BoardColumn
    │           └── MrCard
    │               └── BlockerBadge
    ├── AccountView                 (sección «Mi cuenta»)
    │   ├── AccountSettingsSection
    │   ├── AccountMemberInviteSection  (sólo admin)
    │   ├── GitlabAccountSettingsSection
    │   └── GitlabUserSettingsSection
    ├── ProfileView                 (sección «Mi perfil»)
    │   ├── ProfilePanel
    │   └── PasswordPanel
    └── UserAdmin                    (sección «Usuarios», sólo con rol admin)
```

- `AppShell` presenta la barra superior con el nombre del tablero, la navegación principal y el avatar que abre el menú de cuenta, y envuelve el contenido en el único `main` de la aplicación. «Mi perfil» se abre desde «Editar perfil» y «Mi cuenta» desde «Editar cuenta» —o «Ver cuenta» sin permisos de escritura—; ninguna ocupa un botón propio en la barra. La barra aparece sólo con la sesión abierta, porque el ingreso y el alta son pantallas completas con su propio encabezado principal.
- `LoginForm` pide email y contraseña, muestra el error que devuelve el backend y ofrece pasar al alta.
- `RegisterForm` da de alta la persona y elige entre sus dos caminos excluyentes: sumarse a un equipo con su código de invitación, o abrir uno nuevo. Valida en el navegador las mismas reglas que el backend para avisar antes de enviar.
- `AccountMenu` concentra detrás de un avatar el nombre visible, el email, el equipo, los accesos separados al perfil y a la cuenta, y el cierre de sesión. Se cierra al elegir una acción, al interactuar fuera o con `Escape`, que devuelve el foco al avatar.
- `AccountView` y `ProfileView` componen exclusivamente las secciones de cuenta y perfil; `AuthenticatedRoutes` asocia cada una con su URL.
- `AccountSettingsSection` presenta el equipo: su nombre y cuánta gente lo integra.
- `AccountMemberInviteSection` presenta a un `admin` el código de invitación y permite renovarlo; `App` la compone como una sección independiente dentro de «Mi cuenta».
- `GitlabAccountSettingsSection` carga los IDs de los proyectos y el estado del access token de la cuenta, presenta un skeleton accesible mientras espera y decide entre la edición para un `admin` o el resumen de sólo lectura. `GitlabAccountSettingsForm` concentra los campos, el envío y sus mensajes; el token arranca vacío en cada visita porque el backend nunca lo devuelve, y dejarlo así conserva el guardado.
- `ProfilePanel` permite cambiar el nombre visible y el email propios desde «Mi perfil» y comunica el resultado sin sacar a la persona de la pantalla.
- `GitlabUserSettingsSection` resuelve en «Mi cuenta» el nickname de GitLab propio, lo precarga desde la sesión y permite actualizarlo; de él depende la vista personal.
- `PasswordPanel` resuelve el cambio de la propia contraseña.
- `UserAdmin` lista los usuarios de la cuenta y permite dar de alta, habilitar y deshabilitar. No ofrece restablecer contraseñas: eso se hace por línea de comandos.
- `TopBar` presenta los totales, el estado de sincronización y la actualización manual del tablero.
- `ViewControls` alterna entre la vista general y la personal. El selector de persona aparece sólo con `canChoosePerson`, que `App` activa para un `admin`: el resto ve siempre sus propias tareas, identificadas por `meta.viewerUsername`.
- `MrBoard` agrupa los merge requests por proyecto, mantiene el estado local de expansión y los distribuye según su clasificación. Ambas vistas reutilizan este componente; la personal le entrega únicamente las tareas de la persona seleccionada.
- `BoardColumn` representa una categoría mediante una lista semántica con scroll vertical.
- `MrCard` resume el merge request, presenta los responsables que informa `responsiblePeople` y enlaza a GitLab.
- `BlockerBadge` presenta pipeline, discusiones, aprobaciones y conflictos con texto, icono y estilo semántico.

`mergeRequestColumns.js` define una sola vez las columnas compartidas y reparte cada merge request en la de su clasificación. `personalView.js` busca la persona seleccionada y filtra sus tareas por el `username` que el backend marcó como responsable, según el [dominio de merge requests](../domains/merge-requests.md#responsable).

Los componentes presentacionales reciben valores mediante props y notifican acciones mediante callbacks como `onRefresh`. No mutan las props ni el estado recibido.

## Navegación entre secciones

React Router mantiene una URL por pantalla: `/ingresar`, `/registro`, `/tablero`, `/perfil`, `/cuenta` y `/usuarios`. `BrowserRouter` envuelve la aplicación; `App` declara los `Routes`; y los enlaces de `AppShell` y `AccountMenu` permiten historial, recarga y acceso directo. El rewrite de `frontend/vercel.json` devuelve `index.html` para esas rutas en producción.

`routes.js` define `APP_PATHS` y `NAVIGATION_SECTIONS` como única fuente de verdad. `profile` y `account` llevan `menuOnly` porque se abren desde el avatar y no se muestran en la navegación principal. Al agregar una pantalla hay que sumar su URL, su metadato de navegación si corresponde y su `Route` pública o privada.

Las rutas privadas redirigen a `/ingresar` sin sesión y las públicas redirigen a `/tablero` con una sesión abierta. `sectionsFor(user)` decide qué enlaces puede ver cada persona y `/usuarios` redirige al tablero si el rol no es `admin`. «Mi perfil» siempre es editable por su titular; dentro de «Mi cuenta», el rol decide si el contenido compartido se edita o se consulta, mientras que el nickname personal siempre puede actualizarse. Esconder o redirigir una sección es una cortesía de la interfaz: el backend valida el rol ruta por ruta, según el [dominio de autenticación](../domains/autenticacion.md).

Al cerrar la sesión la app vuelve al tablero, para que la próxima no empiece donde quedó la anterior, y descarta los stores del tablero y de la cuenta.

## Estado compartido

`useMergeRequests.js` mantiene un store a nivel de módulo y lo conecta a React mediante `useSyncExternalStore`. El store es la única fuente de verdad para los datos remotos y contiene:

- `mergeRequests`: resultados consolidados por el backend.
- `meta`: fecha, totales y personas participantes.
- `loading`: indica que existe una actualización en curso.
- `error`: conserva el último error de la consulta.
- `lastFetched`: fecha local de la última respuesta satisfactoria.
- `needsGitlabSettings`: el backend respondió 409 porque en la cuenta todavía falta configurar GitLab. No es un error: el tablero ofrece un acceso directo a «Mi cuenta» a quien puede resolverlo, y al resto le dice que se lo pida a quien administra.
- `viewMode`: vista `general` o `personal` activa.
- `selectedUsername`: identidad elegida para la vista personal durante la sesión.

No hay un provider: todos los consumidores del hook se suscriben a la misma instancia. El estado que deba observar más de un componente debe incorporarse al store; `useState` se reserva para estado local de interfaz, como las secciones expandidas de `MrBoard`.

`features/auth/hooks/useSession.js` mantiene un segundo store con el mismo patrón, porque la sesión también la observan varios componentes, y `features/accounts/hooks/useAccount.js` un tercero para la cuenta, que miran el menú de la barra superior y la pantalla del equipo. Ese último se recarga cuando el `accountId` de la sesión deja de coincidir con la cuenta que tiene guardada, que es lo que pasa al entrar con otro usuario. La lista de usuarios, en cambio, la consume una sola pantalla: `useUsers` la resuelve con estado local.

### Ciclo de suscripción y polling

El primer consumidor que monta el hook inicia una carga y un intervalo de actualización de cinco minutos. Un contador registra cuántos consumidores siguen activos; el intervalo se detiene cuando desmonta el último.

React ejecuta los efectos dos veces durante el montaje de desarrollo por `StrictMode`. La promesa `initialLoad` actúa como guarda para evitar que ese ciclo dispare dos cargas iniciales simultáneas. Todo cambio en las suscripciones, temporizadores o peticiones debe conservar este comportamiento idempotente y limpiar sus recursos al desmontar.

## Acceso al backend

`fetchMergeRequests()` solicita `GET /api/pull-requests` sobre la URL base validada por `src/config.js`. `VITE_API_BASE_URL` debe ser una URL HTTP(S), se normaliza sin barra final y usa `http://localhost:3001` cuando no está definida. La lista de variables y su configuración se mantiene en la [guía de entorno local](../development/entorno-local.md).

La actualización manual invoca `fetchMergeRequests(true)` y agrega `?force=true` para omitir la caché del backend. El polling usa la consulta normal y permite reutilizarla.

Antes de cada solicitud se activa `loading` y se limpia el error anterior. Una respuesta correcta reemplaza los datos, actualiza los metadatos y registra `lastFetched`. Una respuesta HTTP fallida intenta obtener el mensaje JSON del backend y, si no está disponible, usa el código de estado.

Los datos anteriores no se eliminan al fallar una actualización. Si nunca hubo una carga exitosa, `App` presenta un error bloqueante; si ya existen resultados, mantiene el tablero visible y comunica el error desde la barra de estado.

## Estados de la interfaz

`App` contempla explícitamente los siguientes estados:

- **Carga inicial**: muestra un indicador mientras no existen datos.
- **Sin resultados**: informa que no hay merge requests abiertos.
- **Error sin datos**: presenta una alerta con el detalle recibido.
- **Datos disponibles**: muestra el tablero y la hora de la última actualización.
- **Actualización en segundo plano**: conserva el contenido y anuncia el progreso.

Una región viva con `aria-live="polite"` comunica el inicio, el error y la finalización de cada actualización sin mover el foco.

## Presentación y diseño visual

Tailwind concentra los estilos de los componentes. Los colores, superficies, tipografías y estados semánticos se definen como tokens en `tailwind.config.js`; su uso se detalla en la [arquitectura de la interfaz visual](interfaz-visual.md).

`src/assets/main.css` se limita a las capas de Tailwind, el modelo de caja global, el comportamiento general de enlaces, la reducción de movimiento y la apariencia de las barras de desplazamiento. No se debe agregar CSS personalizado cuando una utilidad o un token existente pueda expresar el mismo resultado.

Ambas vistas usan secciones verticales por proyecto. Cada sección despliega seis columnas horizontales en un contenedor desplazable y cada columna limita su altura para desplazar las tarjetas verticalmente. La vista personal conserva exactamente esta estructura y sólo filtra los merge requests entregados al tablero.

## Accesibilidad

La interfaz apunta a WCAG 2.2 nivel AA y aplica estas decisiones:

- `AppShell` incluye un enlace para saltar al contenido principal y presenta la aplicación con un único `main` y un único `h1`.
- La navegación es un `nav` etiquetado y la sección activa se marca con `aria-current="page"`, además del contraste y el peso tipográfico.
- El menú de cuenta expone su estado con `aria-expanded`, mantiene un recorrido de foco natural y se puede cerrar con `Escape` devolviendo el foco al avatar.
- Los estados de carga, vacío y error usan roles semánticos.
- Los cambios asíncronos se anuncian mediante una región viva.
- Los proyectos son secciones desplegables con `aria-expanded` y `aria-controls`.
- El tipo de vista se expone mediante botones con `aria-pressed` y la persona mediante un `select` etiquetado.
- Los cambios de persona y cantidad de tareas se anuncian en la región viva.
- El panel de cada proyecto permanece en el DOM cuando está contraído para que la referencia de `aria-controls` siga siendo válida.
- Las columnas usan encabezados y listas semánticas.
- Los botones y enlaces tienen nombres accesibles y foco visible.
- Los enlaces externos informan que abren una pestaña nueva y usan `rel="noopener"`.
- Los badges combinan texto, iconos y color; ningún estado depende solo del color.
- Las animaciones y transiciones se reducen cuando el sistema indica `prefers-reduced-motion`.

La validación automatizada y manual de estos comportamientos se define en la [estrategia de test](../development/test.md).

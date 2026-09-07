# Vista personal

- Estado: implementada.

## Objetivo

Ver todos los merge requests en los que una persona tiene una acción pendiente. Complementa al tablero general: no lo reemplaza ni modifica sus reglas de clasificación.

**Quién puede mirar a quién depende del rol.** Un usuario común ve siempre sus propias tareas, sin elegir a nadie; sólo un `admin` puede mirar el tablero de otra persona, y para eso tiene el selector.

La persona se identifica por su `username` de GitLab; el nombre visible es sólo presentación, porque puede repetirse o cambiar.

## Alcance

- Alternar entre **Vista general** y **Vista personal** desde la misma aplicación.
- Abrir directamente las tareas propias, sin ningún paso previo.
- Para un `admin`, elegir otra persona mediante un control con etiqueta accesible.
- Mostrar únicamente los MRs donde esa persona sea responsable según el [dominio de merge requests](merge-requests.md#responsable). La vista filtra por el campo `responsiblePeople` que ya viene resuelto: no reimplementa ni duplica la regla.
- Reutilizar el tablero general sin alterar la agrupación por proyecto, las columnas, su orden ni las tarjetas.
- Mantener la actualización manual, el polling, los estados de carga y los errores existentes.
- Mostrar un estado vacío específico cuando la persona no tenga tareas pendientes.

La vista no incorpora preferencias persistentes, notificaciones ni asignación de responsables desde el tablero.

## De quién son las tareas que se muestran

### Un usuario común: siempre las propias

Cada persona guarda su **nickname de GitLab** en «Mi cuenta» ([configuración de GitLab](configuracion-gitlab.md)). El backend lo devuelve en `meta.viewerUsername` junto con el tablero, y la vista personal filtra por él sin pedir nada.

Si todavía no lo configuró, la vista lo pide y enlaza a «Mi cuenta» en lugar de mostrar columnas vacías.

### Un `admin`: cualquiera

Sólo con rol `admin` aparece el selector. El backend reúne a los autores y reviewers de la respuesta consolidada y publica la lista sin duplicados en `meta.people`, ordenada por nombre visible y desempatada por `username`. Cada opción muestra ambos para evitar ambigüedad.

- Al entrar por primera vez no hay persona seleccionada: la interfaz pide elegir una y no muestra columnas vacías.
- La selección permanece durante las actualizaciones y al volver a la vista general, mientras dure la sesión.
- Si la persona deja de aparecer en la lista, se conserva la selección y se muestra el estado sin tareas.

La selección y el modo de vista son estado compartido porque afectan a más de un componente. No se persisten al recargar la página ni se reflejan en la URL.

::: warning No es una barrera de acceso
Esconder el selector es una simplificación de la interfaz, no un permiso: la vista general sigue mostrando todos los merge requests de los proyectos configurados, y la respuesta del backend incluye a todas las personas. Quien quiera mirar los datos de otro los tiene igual.
:::

## Presentación

La vista reutiliza `MrBoard`, así que un mismo MR conserva su proyecto, columna, tarjeta, indicadores y enlace a GitLab. Las únicas diferencias son el filtro y los totales:

- Un encabezado identifica a la persona seleccionada.
- Se mantienen las secciones desplegables de todos los proyectos configurados.
- Los totales cuentan los MRs visibles de la persona, no el total global recibido.
- El estado vacío informa “No tenés tareas pendientes” a quien mira lo suyo, y “No hay tareas pendientes para esta persona” a un `admin` que eligió a alguien.

La interfaz debe funcionar con teclado, conservar foco visible y anunciar los cambios de persona y cantidad de resultados mediante una región viva. La selección no se comunica sólo con color o posición.

## Datos y contrato

El filtrado ocurre en el frontend sobre la respuesta ya consolidada, así que no hace falta un endpoint nuevo y se conservan la caché y el polling. El backend expone `authorUsername`, el `username` de reviewers y aprobadores, `responsiblePeople` por merge request, `meta.people` para el selector y `meta.viewerUsername` con el nickname de quien pide el tablero.

Como todos esos campos llegan normalizados de la misma fuente, `personalView.js` compara los `username` por igualdad exacta. Sólo selecciona datos: no contiene reglas de negocio.

## Casos límite

- Dos personas con el mismo nombre visible permanecen como opciones diferentes.
- Un MR aparece una sola vez para una persona aunque coincida por más de una relación.
- Las aprobaciones con estado `unknown` no se interpretan como aprobación.
- Los MRs `unknown` y `backlog` no se incluyen porque no tienen responsable.
- Una persona sin tareas conserva una vista válida con total cero.

## Implementación

`personalView.js` busca la persona y filtra sus merge requests; el store conserva `viewMode` y `selectedUsername` durante la sesión; `Board` decide de quién son las tareas —`selectedUsername` para un `admin`, `meta.viewerUsername` para el resto— y `ViewControls` muestra el selector sólo con `canChoosePerson`; `MrBoard` recibe la colección completa o la filtrada sin cambiar su estructura. No se agregó ninguna dependencia de routing ni de estado global.

## Decisiones pendientes

Antes de una segunda iteración hay que decidir si la selección se guarda en la URL o en almacenamiento local. No bloquea el alcance actual.

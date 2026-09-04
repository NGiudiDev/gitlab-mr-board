# Vista personal

- Estado: implementada.

## Objetivo

Agregar una vista que permita seleccionar a una persona del equipo y consultar todos los merge requests en los que tiene una acción pendiente. Esta vista complementa al tablero general: no lo reemplaza ni modifica sus reglas de clasificación.

La persona seleccionada se identifica por su `username` de GitLab. El nombre visible se usa sólo para presentación, porque puede repetirse o cambiar.

## Alcance

- Alternar entre **Vista general** y **Vista personal** desde la misma aplicación.
- Elegir una persona mediante un control con etiqueta accesible.
- Mostrar únicamente los MRs donde la persona seleccionada sea responsable según la regla del [dominio de merge requests](merge-requests.md#responsable).
- Reutilizar el tablero general sin alterar la agrupación por proyecto, las columnas, su orden ni las tarjetas.
- Mantener la actualización manual, el polling, los estados de carga y los errores existentes.
- Mostrar un estado vacío específico cuando la persona no tenga tareas pendientes.

La vista no incorpora autenticación de usuarios, una selección automática de “mis tareas”, preferencias persistentes, notificaciones ni asignación de responsables desde el tablero.

## Reglas de responsabilidad

La regla que decide quién es responsable de un merge request es única, vive en el backend y se documenta en [Dominio de Merge Requests](merge-requests.md#responsable). La vista personal filtra por el campo `responsiblePeople` que ya viene resuelto en la respuesta; no reimplementa la regla ni mantiene una segunda versión para el filtrado.

## Selección de persona

El backend reúne a los autores y reviewers presentes en la respuesta consolidada y publica la lista sin duplicados en `meta.people`, ordenada por nombre visible y desempatada por `username`. Cada opción muestra el nombre y el `username` para evitar ambigüedad.

- Al entrar por primera vez en la vista personal no hay una persona seleccionada.
- Mientras no exista selección, la interfaz solicita elegir una persona y no muestra columnas vacías.
- La selección permanece durante las actualizaciones automáticas de datos.
- Si la persona deja de aparecer en la lista después de una actualización, se conserva la selección y se muestra el estado sin tareas.
- Volver a la vista general no descarta la selección durante la sesión actual.

La selección y el modo de vista son estado compartido porque afectan a más de un componente. La primera versión no persiste estos valores al recargar la página ni los incorpora en la URL.

## Presentación

La vista personal reutiliza `MrBoard` para que un mismo MR conserve su proyecto, columna, tarjeta, estado, indicadores y enlace a GitLab. Las únicas diferencias respecto de la vista general son el filtro y los totales:

- Un encabezado identifica claramente a la persona seleccionada.
- Se mantienen las secciones desplegables de todos los proyectos configurados.
- Los totales deben indicar cuántos MRs visibles corresponden a la persona, no el total global recibido desde el backend.
- El estado vacío informa: “No hay tareas pendientes para esta persona”.

La interfaz debe seguir funcionando con teclado, conservar foco visible y anunciar los cambios de persona y cantidad de resultados mediante una región viva. La selección no debe comunicarse únicamente mediante color o posición.

## Datos y contrato

El filtrado se realiza en el frontend sobre la respuesta ya consolidada; no se requiere un endpoint nuevo. Esto conserva una sola consulta, la caché existente y el comportamiento del polling.

El contrato público del backend expone la identidad estable del autor mediante `authorUsername`, además de `author`. Los reviewers incluyen `username` y las aprobaciones incluyen `approvers`. Sobre esos datos el backend calcula `responsiblePeople` por merge request y `meta.people` para el selector.

Como ambos campos llegan normalizados desde la misma fuente, el frontend compara los `username` por igualdad exacta en `personalView.js`, que sólo selecciona datos: no contiene reglas de negocio.

## Casos límite

- Dos personas con el mismo nombre visible deben permanecer como opciones diferentes.
- Un reviewer que ya aprobó no aparece como responsable mientras quede otro reviewer pendiente.
- Si todos los reviewers aprobaron, el MR aparece para su autor.
- Un MR puede aparecer una sola vez para una persona aunque coincida por más de una relación.
- Datos de aprobaciones con estado `unknown` no deben interpretarse como una aprobación.
- Los MRs `unknown` y `backlog` no se incluyen porque no tienen responsable visible.
- Una persona sin tareas conserva una vista válida con total cero.

## Implementación

- El backend agrega `authorUsername`, `responsiblePeople` y `meta.people` al contrato consolidado.
- `personalView.js` busca la persona seleccionada y filtra sus merge requests a partir de esos campos.
- El store conserva `viewMode` y `selectedUsername` durante la sesión.
- `ViewControls` permite alternar la vista y seleccionar una persona.
- `MrBoard` recibe la colección completa en la vista general y la colección filtrada en la vista personal, sin cambiar su estructura.

No se agregó una dependencia de routing ni de estado global: la funcionalidad usa React y el store existentes.

## Criterios de aceptación

- La vista general conserva su comportamiento actual.
- Se puede abrir la vista personal y seleccionar una persona usando sólo el teclado.
- Sólo aparecen MRs donde el `username` seleccionado es responsable.
- En Code Review, las aprobaciones trasladan correctamente la responsabilidad entre reviewers y autor.
- Las tareas mantienen la misma agrupación por proyecto y estado que el tablero general.
- Los cambios de selección y los resultados vacíos se anuncian de forma accesible.
- Una actualización manual o automática conserva la vista y la persona seleccionadas.
- Las pruebas cubren autor responsable, reviewer pendiente, reviewer aprobado, varios reviewers, nombres duplicados, ausencia de reviewers y resultados vacíos.

## Decisiones pendientes

Antes de implementar una segunda iteración se debe decidir si la selección se guarda en la URL o en almacenamiento local, y si una futura autenticación permitirá abrir directamente las tareas de la persona conectada. Estas decisiones no bloquean el alcance inicial.

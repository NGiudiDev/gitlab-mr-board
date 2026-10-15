# Vista personal

La vista personal muestra los merge requests donde una persona tiene una acción pendiente. Es una proyección del tablero general: no cambia la clasificación ni calcula responsables.

## Acceso

| Rol | Persona mostrada |
|---|---|
| `user` | Siempre quien inició sesión, identificado por `meta.viewerUsername`. |
| `admin` | La persona elegida entre `meta.people`. |

Si un usuario no configuró su [nickname de GitLab](autenticacion.md#nickname-de-gitlab), la vista le indica cómo hacerlo. Un administrador sin selección recibe una invitación a elegir una persona.

El selector no es una barrera de seguridad: todos los integrantes ya pueden ver el tablero general completo de su cuenta.

## Regla de filtrado

El frontend conserva únicamente los MRs cuyo `responsiblePeople` contiene el `username` seleccionado. La asignación de responsables pertenece al [dominio de Merge Requests](merge-requests.md#responsable) y nunca se reimplementa en la interfaz.

El filtrado no altera proyectos, columnas, tarjetas, actualización manual ni polling. Los totales cuentan sólo los resultados visibles.

## Contrato

La respuesta del tablero incluye:

- `responsiblePeople` por merge request.
- `meta.people`, con autores y reviewers únicos para el selector de admin.
- `meta.viewerUsername`, agregado para quien consulta y no compartido en la caché.

La vista se resuelve sobre esa respuesta, sin un endpoint adicional. El modo y la selección duran durante la sesión del frontend, pero no se guardan en la URL ni en almacenamiento local.

## Casos límite

- Dos personas con el mismo nombre siguen separadas por `username`.
- Un MR aparece una sola vez aunque una persona coincida por más de una relación.
- `backlog` y `unknown` quedan fuera porque no tienen responsables.
- Una persona sin tareas conserva una vista válida con total cero.

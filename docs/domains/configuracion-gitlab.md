# Configuración de GitLab

Cada **cuenta** indica desde qué proyectos se alimenta su tablero y con qué access token se los consulta. Los carga un administrador una sola vez y con ellos se arma el tablero de todos los miembros: quien se suma no configura nada. Los motivos y las alternativas descartadas están en el [ADR 0008](../decisions/0008-credenciales-de-gitlab-por-usuario.md) y el [ADR 0011](../decisions/0011-cuentas-compartidas.md); este documento describe el modelo y las reglas.

La configuración se carga en la sección **«Mi cuenta»**, en la tarjeta «GitLab de la cuenta». El **nickname de GitLab**, en cambio, lo carga cada persona: pertenece al usuario y no a la cuenta, así que vive en la [autenticación](autenticacion.md#nickname-de-gitlab).

## Modelo de datos

En la misma base Postgres de la [autenticación](autenticacion.md) hay una tabla más:

- **`account_gitlab_settings`**: `account_id` (clave primaria y foránea a `accounts`), `project_ids`, `encrypted_access_token`, `updated_at`. Se borra en cascada al eliminar la cuenta.

Cada cuenta tiene a lo sumo una configuración, así que el alta y la modificación son la misma operación: un `INSERT ... ON CONFLICT DO UPDATE`. Los IDs viven en una columna `TEXT[]`, porque son una lista corta que siempre se lee completa.

Antes esta tabla se llamaba `gitlab_settings` y era de cada usuario. El paso de una a otra lo hace el propio esquema al arrancar: está descrito en el [dominio de cuentas](cuentas.md#migración-desde-la-configuración-por-persona).

## Reglas

### IDs de proyecto

- Al menos uno y como máximo 50.
- Sólo números. Los IDs viajan dentro de la ruta de la API de GitLab, así que aceptar únicamente números evita además que un valor arbitrario altere la URL consultada. Una ruta `grupo/proyecto` se rechaza con HTTP 400.
- Se aceptan escritos como lista o como texto separado por comas, espacios o punto y coma. Se descartan los repetidos y se conserva el orden ingresado.

### Access token

- Un PAT de GitLab con el alcance `read_api` sobre los proyectos configurados. Conviene que sea de alguien que vaya a seguir en el equipo, o un token de grupo: con él consulta todo el mundo.
- Mínimo 20 caracteres. No se exige el prefijo `glpat-`, porque los tokens de proyecto y de grupo usan otros.
- Se guarda **cifrado con AES-256-GCM**, en el formato `v1.vector.etiqueta.cifrado` con las partes en base64. El vector de inicialización es aleatorio en cada guardado, así que cifrar dos veces el mismo token da resultados distintos; la etiqueta de autenticación hace que un valor alterado en la base falle al descifrarse en lugar de devolver basura.
- La clave se deriva con scrypt de `ENCRYPTION_KEY`. Cambiar esa variable vuelve ilegibles los tokens ya guardados: el backend lo registra en el log, trata la configuración como inexistente y hay que cargar el token de nuevo.
- **Nunca vuelve al navegador.** Las respuestas incluyen `tokenHint` —sus últimos cuatro caracteres— para reconocer cuál está guardado.
- Guardar sin escribir un token nuevo conserva el que ya estaba, de modo que se pueden cambiar los proyectos sin volver a escribirlo. En la primera configuración el token es obligatorio.

## Endpoints

Todos operan sobre la configuración de la cuenta de quien tiene la sesión abierta: el `account_id` sale de la sesión y nunca del cuerpo de la petición, así que no hay forma de leer ni modificar la de otra cuenta.

| Ruta | Permiso | Uso |
|---|---|---|
| `GET /api/gitlab-settings` | Sesión | Devuelve `{ settings }` con `projectIds`, `tokenHint` y `updatedAt`, o `null` si no hay nada configurado |
| `PUT /api/gitlab-settings` | `admin` | Recibe `{ projectIds, accessToken? }` y devuelve la configuración guardada |
| `DELETE /api/gitlab-settings` | `admin` | Borra la configuración y responde 204 |

La lectura la puede hacer cualquier miembro: necesita saber si el tablero ya tiene de dónde alimentarse y, si no, a quién pedírselo. La escritura exige rol `admin`, porque un cambio afecta a todo el equipo; al resto le responde **403**.

Los datos inválidos responden **HTTP 400** con el motivo en español.

## Efecto en el tablero

`GET /api/pull-requests` consulta GitLab con el token de la cuenta de quien pregunta. Sin configuración responde **HTTP 409** con `{ "error": ..., "code": "gitlab_settings_missing" }`. El frontend presenta un enlace a «Mi cuenta» a quien puede resolverlo, y a los demás les dice que se lo pidan a quien administra.

La caché del tablero es **por cuenta** y guarda junto a la respuesta la fecha de la configuración con la que se consultó. Cambiar los proyectos o el token cambia esa fecha, así que la entrada guardada deja de servir sin necesidad de avisarle al router. Lo único que no se comparte es `meta.viewerUsername`, que la ruta completa con el nickname de quien pregunta al entregar la respuesta. El resto del comportamiento de la caché —TTL, `force=true` y su alcance por proceso— está en la [arquitectura del backend](../architecture/backend.md#caché).

# Configuración de GitLab

Cada persona indica desde qué proyectos se alimenta su tablero y con qué access token se los consulta. Los motivos y las alternativas descartadas están en el [ADR 0008](../decisions/0008-credenciales-de-gitlab-por-usuario.md); este documento describe el modelo y las reglas.

La configuración se carga en la sección **«Mi cuenta»**, junto al cambio de la propia contraseña.

## Modelo de datos

En la misma base Postgres de la [autenticación](autenticacion.md) hay una tabla más:

- **`gitlab_settings`**: `user_id` (clave primaria y foránea a `users`), `project_ids`, `encrypted_access_token`, `updated_at`. Se borra en cascada al eliminar el usuario.

Cada persona tiene a lo sumo una configuración, así que el alta y la modificación son la misma operación: un `INSERT ... ON CONFLICT DO UPDATE`. Los IDs viven en una columna `TEXT[]`, porque son una lista corta que siempre se lee completa.

## Reglas

### IDs de proyecto

- Al menos uno y como máximo 50.
- Sólo números. Los IDs viajan dentro de la ruta de la API de GitLab, así que aceptar únicamente números evita además que un valor arbitrario altere la URL consultada. Una ruta `grupo/proyecto` se rechaza con HTTP 400.
- Se aceptan escritos como lista o como texto separado por comas, espacios o punto y coma. Se descartan los repetidos y se conserva el orden ingresado.

### Access token

- Un PAT de GitLab con el alcance `read_api` sobre los proyectos configurados.
- Mínimo 20 caracteres. No se exige el prefijo `glpat-`, porque los tokens de proyecto y de grupo usan otros.
- Se guarda **cifrado con AES-256-GCM**, en el formato `v1.vector.etiqueta.cifrado` con las partes en base64. El vector de inicialización es aleatorio en cada guardado, así que cifrar dos veces el mismo token da resultados distintos; la etiqueta de autenticación hace que un valor alterado en la base falle al descifrarse en lugar de devolver basura.
- La clave se deriva con scrypt de `ENCRYPTION_KEY`. Cambiar esa variable vuelve ilegibles los tokens ya guardados: el backend lo registra en el log, trata la configuración como inexistente y la persona tiene que cargar el token de nuevo.
- **Nunca vuelve al navegador.** Las respuestas incluyen `tokenHint` —sus últimos cuatro caracteres— para reconocer cuál está guardado.
- Guardar sin escribir un token nuevo conserva el que ya estaba, de modo que se pueden cambiar los proyectos sin volver a escribirlo. En la primera configuración el token es obligatorio.

## Endpoints

Todos exigen sesión y operan siempre sobre la configuración de quien la tiene abierta: no hay forma de leer ni modificar la de otra persona.

| Ruta | Uso |
|---|---|
| `GET /api/gitlab-settings` | Devuelve `{ settings }` con `projectIds` y `tokenHint`, o `null` si no hay nada configurado |
| `PUT /api/gitlab-settings` | Recibe `{ projectIds, accessToken? }` y devuelve la configuración guardada |
| `DELETE /api/gitlab-settings` | Borra la configuración y responde 204 |

Los datos inválidos responden **HTTP 400** con el motivo en español.

## Efecto en el tablero

`GET /api/pull-requests` consulta GitLab con el token de quien pregunta. Sin configuración responde **HTTP 409** con `{ "error": ..., "code": "gitlab_settings_missing" }`, y el frontend presenta un enlace a «Mi cuenta» en lugar de un error.

La caché del tablero es **por usuario** y guarda junto a la respuesta la fecha de la configuración con la que se consultó. Cambiar los proyectos o el token cambia esa fecha, así que la entrada guardada deja de servir sin necesidad de avisarle al router. El resto del comportamiento de la caché —TTL, `force=true` y su alcance por proceso— está en la [arquitectura del backend](../architecture/backend.md#caché).

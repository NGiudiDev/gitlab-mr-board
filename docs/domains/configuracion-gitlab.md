# Configuración de GitLab

Cada cuenta define una lista de proyectos y un access token para construir su tablero. Un administrador configura ambos una sola vez y todos los integrantes consumen el mismo resultado.

El nickname de GitLab es personal y se define en [Autenticación](autenticacion.md#nickname-de-gitlab).

## Modelo

`account_gitlab_settings` mantiene una única configuración por cuenta:

- `account_id`: clave primaria y referencia a la cuenta.
- `project_ids`: lista de proyectos.
- `encrypted_access_token`: token cifrado.
- `updated_at`: versión usada para invalidar la caché.

## Proyectos

- Se exige entre uno y cincuenta IDs numéricos.
- Se aceptan como lista o como texto separado por comas, espacios o punto y coma.
- Se eliminan repetidos y se conserva el orden ingresado.
- Una ruta `grupo/proyecto` no es válida: la API trabaja con IDs.

## Access token

El token debe tener al menos 20 caracteres y alcance `read_api` sobre todos los proyectos configurados. Puede ser personal, de proyecto o de grupo; no se exige un prefijo específico.

Se cifra con AES-256-GCM y una clave derivada de `ENCRYPTION_KEY`. Cambiar esa variable vuelve ilegibles los token guardados y obliga a cargarlos nuevamente.

El token nunca vuelve al navegador. La lectura sólo incluye `tokenHint` con sus últimos cuatro caracteres. En una actualización, omitir un token nuevo conserva el existente; la primera configuración sí lo exige.

## Permisos y endpoints

Todas las operaciones usan la cuenta de la sesión.

| Ruta | Acceso | Uso |
|---|---|---|
| `GET /api/gitlab-settings` | Sesión | Devuelve proyectos, `tokenHint` y fecha, o `null`. |
| `PUT /api/gitlab-settings` | Admin | Crea o actualiza la configuración. |
| `DELETE /api/gitlab-settings` | Admin | Elimina la configuración. |

Una configuración inválida responde 400 y una escritura sin rol, 403.

## Efecto en el tablero

Sin configuración, `GET /api/pull-requests` responde 409 con el código `gitlab_settings_missing`. El frontend guía al administrador hacia «Mi cuenta» y al resto le indica que solicite la configuración.

Cambiar proyectos o token modifica `updated_at` e invalida la entrada de caché asociada. El comportamiento general de la caché está en la [arquitectura del backend](../architecture/backend.md#caché).

# ADR 0008: guardar las credenciales de GitLab por usuario y cifradas

- Estado: aceptada
- Fecha: 2026-09-07

## Contexto

Hasta ahora el tablero se alimentaba de un único token y una única lista de proyectos, cargados en `backend/.env` como `GITLAB_TOKEN` y `PROJECT_IDS`. Eso obligaba a que todo el equipo mirara los mismos proyectos con el mismo PAT, y a que cambiar cualquiera de los dos fuera una edición de archivo más un reinicio del backend.

Desde el [ADR 0006](0006-login-local-con-sqlite.md) el backend ya tiene usuarios propios y una base SQLite, así que existe dónde guardar una configuración por persona.

## Decisión

Cada usuario configura sus propios IDs de proyecto y su propio access token desde la sección «Mi cuenta», y el backend los guarda en la tabla `gitlab_settings` de la misma base.

- El access token se guarda **cifrado con AES-256-GCM** (`node:crypto`). La clave se deriva con scrypt de la variable `ENCRYPTION_KEY`, que pasa a ser obligatoria.
- El token **nunca vuelve al navegador**: las respuestas sólo incluyen sus últimos cuatro caracteres, para reconocer cuál está guardado.
- `GITLAB_TOKEN` y `PROJECT_IDS` **dejan de existir** como configuración del proceso. `GITLAB_BASE_URL` sigue siendo global: la instancia de GitLab es una sola.
- El cliente de GitLab se construye por consulta con el token de quien pregunta, y la caché del tablero pasa a ser por usuario.

Las reglas y el modelo de datos se documentan en la [configuración de GitLab](../domains/configuracion-gitlab.md).

## Alternativas consideradas

- **Una única configuración global guardada en la base, editable sólo por un administrador**: cambio más chico, pero mantiene el token compartido y no resuelve que cada persona siga proyectos distintos.
- **Conservar el `.env` como respaldo cuando alguien no configuró nada**: dos fuentes de verdad para el mismo dato, con una precedencia que hay que explicar y que oculta de quién es el token que se está usando.
- **Guardar el token sin cifrar, como el hash de las contraseñas**: no alcanza. Una contraseña se puede guardar derivada porque sólo hay que verificarla; el token hay que poder recuperarlo para consultar GitLab, así que la única protección posible es el cifrado reversible.
- **OAuth con GitLab**: evitaría custodiar tokens, pero exige registrar una aplicación y mantener el intercambio de tokens; sigue siendo la evolución natural, igual que en el [ADR 0006](0006-login-local-con-sqlite.md).

## Consecuencias

- Una instalación nueva no necesita ningún dato de GitLab para arrancar: el backend levanta y cada persona completa lo suyo. A cambio, el tablero responde HTTP 409 hasta que haya configuración.
- Aparece un secreto de despliegue nuevo, `ENCRYPTION_KEY`, que hay que respaldar junto con la base: perderla vuelve ilegibles todos los tokens guardados y obliga a cargarlos de nuevo. El backend lo detecta, lo registra y trata esa configuración como inexistente.
- La caché deja de ser una sola respuesta por proceso y pasa a ser una por usuario, con lo que crece con el equipo. Sigue siendo en memoria ([ADR 0002](0002-cache-en-memoria.md)) y sigue sin compartirse entre instancias.
- Cada persona consulta GitLab con sus propios permisos, así que el tablero deja de mostrar lo que el token compartido veía y pasa a mostrar lo que ve quien mira. Es lo esperado, pero cambia lo que dos personas ven del mismo proyecto.
- El límite de concurrencia del cliente de GitLab sigue siendo del proceso, no de cada usuario: más personas mirando el tablero no multiplican las consultas simultáneas contra GitLab.

# Arquitectura del producto

GitLab MR Board reúne los merge requests abiertos de varios proyectos de GitLab en un tablero compartido. El equipo ve el mismo conjunto de datos y cada persona puede enfocarse en las tareas que el backend le asignó.

## Qué resuelve

- Consolida proyectos distintos en una sola vista.
- Clasifica los merge requests según su estado real.
- Indica responsables, bloqueos y condiciones pendientes.
- Ofrece una vista general y otra personal.
- Comparte la configuración de GitLab dentro de una cuenta.
- Guarda datos propios del tablero, como la fecha de subida.

Las reglas de clasificación y responsabilidad se mantienen en [Merge Requests](../domains/merge-requests.md). El comportamiento de la vista personal está en [Vista personal](../domains/vista-personal.md).

## Personas y permisos

| Rol | Puede hacer |
|---|---|
| Miembro | Consultar el tablero, usar su vista personal, editar su perfil y su nickname de GitLab, y ver la configuración compartida. |
| Administrador | Todo lo anterior, más administrar integrantes, cuenta, invitación y configuración de GitLab. |

Los permisos siempre se validan en el backend. Ocultar una acción en la interfaz no concede ni revoca acceso. Las reglas completas están en [Autenticación](../domains/autenticacion.md) y [Cuentas](../domains/cuentas.md).

## Límites del sistema

```text
Navegador React
      |
      v
API BFF con Express ----> API de GitLab
      |
      +-----------------> Postgres en Neon
      |
      +-----------------> Servicio de correo
```

- El navegador sólo se comunica con el BFF y nunca recibe el access token de GitLab.
- El BFF autentica la sesión, aplica permisos y reglas de negocio, consulta GitLab y entrega un contrato adaptado a la interfaz.
- Neon conserva cuentas, usuarios, sesiones, configuración y datos propios del tablero.
- Los datos obtenidos de GitLab no se persisten: cada proceso los mantiene temporalmente en una caché por cuenta.
- El servicio de correo se usa para recuperar contraseñas.

## Recorrido principal

1. Una persona crea una cuenta o se suma a una existente con un código de invitación.
2. Un administrador configura los proyectos y el access token de GitLab una sola vez para el equipo.
3. El frontend solicita el tablero con la cookie de sesión.
4. El backend reutiliza la caché vigente o consulta GitLab, enriquece los merge requests y calcula su clasificación y responsables.
5. El frontend agrupa el resultado por proyecto y lo presenta en la vista general o personal.
6. Los cambios propios del tablero se validan y persisten en Neon.

La configuración compartida se detalla en [Configuración de GitLab](../domains/configuracion-gitlab.md).

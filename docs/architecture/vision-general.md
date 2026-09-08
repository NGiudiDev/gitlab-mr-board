# Visión general de la arquitectura

GitLab MR Board usa un patrón Backend for Frontend (BFF):

```text
Navegador (React) -> API BFF (Express) -> API v4 de GitLab
       :5173             :3001
```

El frontend solicita una vista consolidada mediante `GET /api/pull-requests`. El backend conserva el token de quien pregunta, consulta los proyectos que esa persona configuró, enriquece cada MR, calcula su estado y devuelve datos adaptados al tablero.

## Flujo principal

1. El usuario ingresa con su cuenta del tablero y el backend le entrega una cookie de sesión.
2. El frontend consulta `/api/pull-requests` con esa cookie.
3. La ruta verifica la sesión y devuelve la caché vigente o solicita datos nuevos.
4. El servicio consulta los proyectos y detalles de MRs en paralelo.
5. Un limitador restringe las solicitudes concurrentes a GitLab.
6. El backend normaliza y clasifica los MRs.
7. React agrupa el resultado por proyecto y lo muestra en columnas.

La caché vive en memoria, por cuenta, y los token sólo pertenecen al backend. La única persistencia es una base Postgres alojada en Neon ([ADR 0009](../decisions/0009-neon-como-base-de-datos.md)) con las cuentas ([cuentas](../domains/cuentas.md)), los usuarios y las sesiones ([autenticación](../domains/autenticacion.md)) y los proyectos y access token de cada cuenta, con el token cifrado ([configuración de GitLab](../domains/configuracion-gitlab.md)). Los detalles de cada paquete están en [Backend](backend.md) y [Frontend](frontend.md).

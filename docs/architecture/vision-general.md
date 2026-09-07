# Visión general de la arquitectura

GitLab MR Board usa un patrón Backend for Frontend (BFF):

```text
Navegador (React) -> API BFF (Express) -> API v4 de GitLab
       :5173             :3001
```

El frontend solicita una vista consolidada mediante `GET /api/pull-requests`. El backend conserva el token, consulta los proyectos, enriquece cada MR, calcula su estado y devuelve datos adaptados al tablero.

## Flujo principal

1. El usuario ingresa con su cuenta del tablero y el backend le entrega una cookie de sesión.
2. El frontend consulta `/api/pull-requests` con esa cookie.
3. La ruta verifica la sesión y devuelve la caché vigente o solicita datos nuevos.
4. El servicio consulta los proyectos y detalles de MRs en paralelo.
5. Un limitador restringe las solicitudes concurrentes a GitLab.
6. El backend normaliza y clasifica los MRs.
7. React agrupa el resultado por proyecto y lo muestra en columnas.

La caché vive en memoria y el token solo pertenece al backend. La única persistencia es una base SQLite local con los usuarios y las sesiones, descrita en el [dominio de autenticación](../domains/autenticacion.md). Los detalles de cada paquete están en [Backend](backend.md) y [Frontend](frontend.md).

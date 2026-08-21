# Visión general de la arquitectura

GitLab MR Board usa un patrón Backend for Frontend (BFF):

```text
Navegador (Vue) -> API BFF (Express) -> API v4 de GitLab
       :5173             :3001
```

El frontend solicita una vista consolidada mediante `GET /api/pull-requests`. El backend conserva el token, consulta los proyectos, enriquece cada MR, calcula su estado y devuelve datos adaptados al tablero.

```text
gitlab-mr-board/
├── README.md
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── development/
│   ├── deployment/
│   └── domains/
├── backend/
└── frontend/
```

No existe actualmente `infrastructure/`: el repositorio no contiene infraestructura como código ni manifiestos de despliegue.

## Flujo principal

1. El frontend consulta `/api/pull-requests`.
2. La ruta devuelve la caché vigente o solicita datos nuevos.
3. El servicio consulta los proyectos y detalles de MRs en paralelo.
4. Un limitador restringe las solicitudes concurrentes a GitLab.
5. El backend normaliza y clasifica los MRs.
6. Vue agrupa el resultado por proyecto y lo muestra en columnas.

La caché vive en memoria, el token solo pertenece al backend y no hay base de datos ni autenticación propia.

# GitLab MR Board

Dashboard unificado de Merge Requests de GitLab para trackear bloqueantes de multiples proyectos en un solo lugar.

## Motivacion

En equipos que trabajan con multiples repositorios en GitLab, es comun perder visibilidad sobre el estado real de los Merge Requests: cuales estan bloqueados por approvals pendientes, cuales tienen hilos de discusion sin resolver, cuales tienen el pipeline roto. Este dashboard consolida toda esa informacion en una vista unica con indicadores visuales claros.

## Arquitectura

El proyecto usa un patron **Backend-for-Frontend (BFF)**:

```
┌──────────────┐     GET /api/pull-requests     ┌──────────────┐     GitLab API v4      ┌──────────┐
│   Frontend   │  ─────────────────────────────► │   Backend    │  ───────────────────►  │  GitLab  │
│   (Vue.js)   │  ◄───────────────────────────── │  (Express)   │  ◄───────────────────  │          │
│   Port 5173  │         JSON limpio             │   Port 3001  │     PRIVATE-TOKEN      │          │
└──────────────┘                                 └──────────────┘                        └──────────┘
```

- **Backend**: Guarda el token de GitLab de forma segura, consulta la API, enriquece cada MR con datos de bloqueantes y devuelve un JSON consolidado.
- **Frontend**: Consume el JSON del backend y lo presenta en un tablero visual con colores por estado.

## Estructura del proyecto

```
gitlab-mr-board/
├── backend/                  # Node.js + Express (BFF)
│   ├── docs/                 # Documentacion del backend
│   ├── src/                  # Codigo fuente
│   ├── .env.example          # Template de configuracion
│   └── package.json
│
├── frontend/                 # Vue.js 3 + Vite + Tailwind CSS
│   ├── docs/                 # Documentacion del frontend
│   ├── src/                  # Codigo fuente
│   └── package.json
│
├── gitlab-mr-board_1.html    # Prototipo original (referencia)
└── README.md                 # Este archivo
```

## Quick Start

### Requisitos

- **Node.js** >= 18.0.0
- Un **Personal Access Token** de GitLab con scope `read_api`
- Los **IDs numericos** de los proyectos que quieras trackear

### 1. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus valores:

```env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_BASE_URL=https://gitlab.com
PROJECT_IDS=12345,67890,11223
```

> Para encontrar el ID de un proyecto en GitLab: ir a la pagina del proyecto → Settings → General → el ID aparece debajo del nombre del proyecto.

### 2. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Ejecutar

En dos terminales separadas:

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npx vite
```

Abrir `http://localhost:5173` en el navegador.

## Funcionalidades

### Bloqueantes visuales

Cada MR muestra tres indicadores de bloqueantes:

| Indicador      | Verde             | Amarillo          | Rojo                |
|----------------|-------------------|-------------------|---------------------|
| **Pipeline**   | CI paso           | CI corriendo      | CI fallo/cancelado  |
| **Hilos**      | Todos resueltos   | —                 | Hilos abiertos      |
| **Approvals**  | Aprobaciones ok   | Faltan approvals  | —                   |

El borde izquierdo de cada card resume el estado general:

- **Verde**: Listo para mergear
- **Amarillo**: Pendientes (approvals o CI corriendo)
- **Rojo**: Bloqueado (pipeline fallo, hilos abiertos, conflictos)
- **Gris**: Draft/WIP

### Vistas

- **Por proyecto**: Columnas por repositorio
- **Por estado**: Columnas por nivel de mergeability (Bloqueadas, Pendientes, Listas, Draft)

### Actualizacion automatica

- Polling cada 5 minutos via `setInterval`
- Boton "Refrescar ahora" para actualizacion manual inmediata
- Cache server-side de 1 minuto para evitar saturar la API de GitLab

### Filtros

- Busqueda por texto (titulo, autor, rama, proyecto)
- Filtro por proyecto via chips toggleables

## Documentacion detallada

- [Backend: README](backend/docs/README.md)
- [Backend: API Reference](backend/docs/api-reference.md)
- [Backend: Arquitectura](backend/docs/architecture.md)
- [Frontend: README](frontend/docs/README.md)
- [Frontend: Componentes](frontend/docs/components.md)
- [Frontend: Guia de estilos](frontend/docs/styling.md)

## Limitaciones conocidas

- **Approvals API**: Requiere GitLab Premium o Ultimate. En GitLab Free, el indicador de approvals muestra "?" en lugar de datos.
- **Rate limits**: GitLab.com permite 300 requests/minuto. Con muchos proyectos y MRs, considerar aumentar el TTL del cache.
- **Sin autenticacion propia**: El dashboard no tiene login — cualquiera con acceso a la URL puede ver los MRs. Adecuado para redes internas o VPN.
- **Sin persistencia**: No usa base de datos. El cache es en memoria y se pierde al reiniciar el backend.

## Evolucion futura

Posibles mejoras para versiones posteriores:

- Agregar vista de tablero personalizado con drag-and-drop (presente en el prototipo original)
- WebSocket o Server-Sent Events para reemplazar el polling
- Notificaciones cuando un MR cambia de estado
- Filtros por label, autor o rama destino
- Soporte multi-grupo ademas de multi-proyecto

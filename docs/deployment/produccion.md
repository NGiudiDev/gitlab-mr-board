# Despliegue en producción

Los requisitos de runtime y las variables disponibles se mantienen en la [guía de entorno local](../development/entorno-local.md).

## Frontend

```bash
cd frontend
npm ci
npm run build
```

Definir `VITE_API_BASE_URL` con la URL pública del backend antes del build y servir `frontend/dist/` como contenido estático. El valor queda incorporado en los archivos generados; el predeterminado `http://localhost:3001` se reserva para desarrollo local.

## Backend

```bash
cd backend
npm ci
npm run build
npm prune --omit=dev
npm run start:prod
```

Proporcionar las variables de entorno y almacenar `ENCRYPTION_KEY` como secreto. Los PAT de GitLab ya no son configuración del despliegue: los carga cada persona desde «Mi cuenta» y se guardan cifrados en la base ([configuración de GitLab](../domains/configuracion-gitlab.md)).

El login guarda usuarios, sesiones y la configuración de GitLab en la base SQLite de `DATABASE_PATH`. En producción hay que montarla en un volumen persistente: si el sistema de archivos es efímero, cada despliegue borra los usuarios. El primer usuario se crea registrándose en el tablero —queda administrador— o con `npm run users --prefix backend -- create <usuario>`, según el [dominio de autenticación](../domains/autenticacion.md).

## Operación

- Publicar ambos servicios detrás de HTTPS y dejar `COOKIE_SECURE=true`, para que la cookie de sesión no viaje en claro. Con `NODE_ENV=production` ya queda activo.
- Ajustar CORS en `backend/src/app.ts`; hoy solo permite los orígenes locales con puertos 5173 y 4173.
- Usar `/health` como chequeo de vida, sabiendo que no valida GitLab.
- Mantener una instancia o aceptar cachés independientes.
- Respaldar el archivo de `DATABASE_PATH` **y `ENCRYPTION_KEY`**: es el único estado que el backend no puede reconstruir, y sin esa clave los access token guardados quedan ilegibles y hay que cargarlos de nuevo.
- Tener presente que **el registro es abierto**: quien alcance la URL puede crearse una cuenta y ver el tablero ([ADR 0007](../decisions/0007-registro-abierto-y-gestion-de-usuarios.md)). No publicar el tablero en internet sin cerrar antes el alta.
- Verificar que `/api/pull-requests` responda 401 sin sesión y que el navegador nunca reciba un access token de GitLab.

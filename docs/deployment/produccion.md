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

Proporcionar las variables de entorno y almacenar el PAT como secreto.

## Operación

- Publicar ambos servicios detrás de HTTPS.
- Ajustar CORS en `backend/src/app.ts`; hoy solo permite los orígenes locales con puertos 5173 y 4173.
- Usar `/health` como chequeo de vida, sabiendo que no valida GitLab.
- Mantener una instancia o aceptar cachés independientes.
- Verificar `/api/pull-requests` y que el navegador nunca reciba `GITLAB_TOKEN`.

# Despliegue en producción

## Frontend

```bash
cd frontend
npm ci
npm run build
```

Servir `frontend/dist/` como contenido estático. Definir `VITE_API_BASE_URL` antes del build si la API no comparte origen.

## Backend

```bash
cd backend
npm ci --omit=dev
npm start
```

Proporcionar las variables de la [guía local](../development/entorno-local.md) y almacenar el PAT como secreto.

## Operación

- Publicar ambos servicios detrás de HTTPS.
- Ajustar CORS en `backend/src/index.js`; hoy solo permite los puertos locales 5173 y 4173.
- Usar `/health` como prueba de vida, sabiendo que no valida GitLab.
- Mantener una instancia o aceptar cachés independientes.
- Verificar `/api/pull-requests` y que el navegador nunca reciba `GITLAB_TOKEN`.

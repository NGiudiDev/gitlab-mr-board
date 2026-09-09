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
npm ci --omit=dev
npm start
```

No hay paso de compilación: Node ejecuta directamente los archivos de `src/` ([ADR 0012](../decisions/0012-javascript-sin-typescript.md)).

En Vercel, crear un proyecto con `backend/` como Root Directory y dejar que detecte Express. `src/app.js` exporta el handler de la Function y comparte con el arranque local la preparación de la base; no configurar Build Command ni Output Directory.

Proporcionar las variables de entorno y almacenar `ENCRYPTION_KEY` como secreto. Los PAT de GitLab ya no son configuración del despliegue: los carga un administrador de cada cuenta desde «Mi cuenta» y se guardan cifrados en la base ([configuración de GitLab](../domains/configuracion-gitlab.md)).

El login guarda usuarios, sesiones y la configuración de GitLab en la base Postgres de `DATABASE_URL`, alojada en Neon ([ADR 0009](../decisions/0009-neon-como-base-de-datos.md)). Al ser una base administrada, el despliegue ya no necesita volumen persistente y el sistema de archivos puede ser efímero. El esquema se aplica solo al arrancar. El primer usuario se crea registrándose en el tablero —queda administrador— o con `npm run users --prefix backend -- create <usuario>`, según el [dominio de autenticación](../domains/autenticacion.md).

## Operación

- Publicar ambos servicios detrás de HTTPS y dejar `COOKIE_SECURE=true`, para que la cookie de sesión no viaje en claro. Con `NODE_ENV=production` ya queda activo.
- Ajustar CORS en `backend/src/app.js`; hoy solo permite los orígenes locales con puertos 5173 y 4173.
- Usar `/health` como chequeo de vida, sabiendo que no valida GitLab.
- Se pueden correr varias instancias: comparten la base, pero no la caché del tablero, que sigue siendo por proceso ([ADR 0002](../decisions/0002-cache-en-memoria.md)).
- El respaldo de la base lo cubre Neon, con sus ramas y su recuperación por punto en el tiempo. Lo que sí hay que respaldar aparte es **`ENCRYPTION_KEY`**: sin ella, un volcado de la base no alcanza para recuperar los access token y cada cuenta tiene que cargar el suyo de nuevo.
- Usar la cadena de conexión del pooler y vigilar el consumo de conexiones si crece la cantidad de instancias.
- Tener presente que **el registro es abierto**: quien alcance la URL puede crearse una cuenta y ver el tablero ([ADR 0007](../decisions/0007-registro-abierto-y-gestion-de-usuarios.md)). No publicar el tablero en internet sin cerrar antes el alta.
- Verificar que `/api/pull-requests` responda 401 sin sesión y que el navegador nunca reciba un access token de GitLab.

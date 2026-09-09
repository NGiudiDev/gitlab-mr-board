# Despliegue en producción

Los requisitos de runtime y las variables disponibles se mantienen en la [guía de entorno local](../development/entorno-local.md).

## Frontend

```bash
cd frontend
npm ci
npm run build
```

Servir `frontend/dist/` como contenido estático. En Vercel, crear un proyecto con `frontend/` como Root Directory, dejar `VITE_API_BASE_URL` sin definir y conservar el rewrite de `frontend/vercel.json`: el navegador consulta `/api` en el mismo origen y Vercel deriva esas solicitudes al proyecto del backend. El valor `http://localhost:3001` se reserva para desarrollo local.

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
- Mantener las llamadas del frontend en el mismo origen mediante el rewrite de Vercel. Si se publica otro frontend que consulte directamente al backend, agregar explícitamente su origen permitido en `backend/src/app.js` y revisar también la política de la cookie de sesión.
- Usar `/health` como chequeo de vida, sabiendo que no valida GitLab.
- Se pueden correr varias instancias: comparten la base, pero no la caché del tablero, que sigue siendo por proceso ([ADR 0002](../decisions/0002-cache-en-memoria.md)).
- El respaldo de la base lo cubre Neon, con sus ramas y su recuperación por punto en el tiempo. Lo que sí hay que respaldar aparte es **`ENCRYPTION_KEY`**: sin ella, un volcado de la base no alcanza para recuperar los access token y cada cuenta tiene que cargar el suyo de nuevo.
- Usar la cadena de conexión del pooler y vigilar el consumo de conexiones si crece la cantidad de instancias.
- Tener presente que **el registro es abierto**: quien alcance la URL puede crearse una cuenta y ver el tablero ([ADR 0007](../decisions/0007-registro-abierto-y-gestion-de-usuarios.md)). No publicar el tablero en internet sin cerrar antes el alta.
- Verificar que `/api/pull-requests` responda 401 sin sesión y que el navegador nunca reciba un access token de GitLab.

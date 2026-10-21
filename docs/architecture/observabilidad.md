# Observabilidad

Sentry recibe los errores no controlados del backend y del frontend. La
integración es opcional: si el paquete no tiene un DSN configurado, la
aplicación conserva su comportamiento y no intenta enviar reportes.

## Alcance

El backend reporta los errores que alcanzan el manejador HTTP 500, los fallos
al preparar la función de Vercel y los errores de arranque del proceso local.
Antes de terminar por un fallo de arranque espera hasta dos segundos para
vaciar los envíos pendientes.

El frontend usa los callbacks de `createRoot` de React 19 para reportar errores
contenidos, recuperables y no controlados. El SDK también conserva sus
integraciones predeterminadas para errores globales del navegador y promesas
rechazadas.

Los dos adaptadores toleran un fallo de inicialización de Sentry: lo escriben
en la consola y dejan funcionar la aplicación sin reportes remotos.

## Privacidad

Ambos SDK se inicializan con `sendDefaultPii: false`, eliminan los campos
`request` y `user` antes del envío y deshabilitan breadcrumbs. El backend sólo
agrega manualmente el método y la ruta de la solicitud. No se debe agregar a los
reportes el access token de GitLab, la cookie de sesión, contraseñas ni datos
completos de una persona.

## Configuración y despliegue

Cada paquete puede usar un proyecto de Sentry distinto y, por lo tanto, su
propio DSN. Las variables disponibles y sus valores predeterminados se
mantienen en la [configuración del README](https://github.com/NGiudiDev/gitlab-mr-board/blob/main/README.md#configuraci%C3%B3n).
Las variables `VITE_*` se resuelven al construir el frontend: cualquier cambio
de DSN requiere reiniciar Vite o desplegar un bundle nuevo.

`SENTRY_RELEASE` y `VITE_SENTRY_RELEASE` deben recibir el mismo identificador
inmutable del despliegue, por ejemplo el SHA del commit. Esto permite relacionar
un fallo del navegador con uno del backend. Si no se configuran, ambos paquetes
usan el SHA que Vercel expone durante el build, siempre que el proyecto tenga
habilitadas las variables de sistema. El ambiente del backend sale de `NODE_ENV`;
el frontend usa el modo con el que Vite genera la aplicación.

Esta integración no publica source maps. Si se incorpora su carga en CI, el
token de autenticación de Sentry debe permanecer sólo en el entorno del build y
nunca usar el prefijo `VITE_`.

La verificación controlada de ambos proyectos se documenta en el
[test operativo de Sentry](../development/test.md#test-operativo-de-sentry).

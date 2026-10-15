# Test

Esta página es la fuente de verdad para ejecutar, escribir y validar los test. El [ADR 0003](../decisions/0003-estrategia-de-test.md) explica por qué se eligió esta estrategia.

## Niveles y herramientas

| Nivel | Herramientas | Dependencias externas |
|---|---|---|
| Unitario e integración del backend | Vitest y PGlite | Ninguna |
| Componentes y stores del frontend | Vitest, React Testing Library y happy-dom | Ninguna |
| Extremo a extremo | Playwright sobre Chromium | GitLab y Neon dedicados a test |

`npm test` no accede a GitLab ni a Neon. PGlite ejecuta el esquema y los repositorios con PostgreSQL en memoria; los servicios externos se reemplazan por dobles controlados.

## Comandos

| Comando | Alcance |
|---|---|
| `npm test` | Test unitarios y de integración de backend y frontend. |
| `npm test --prefix backend` | Backend. |
| `npm test --prefix frontend` | Frontend. |
| `npm run test:watch --prefix <paquete>` | Suite de un paquete en modo interactivo. |
| `npm run test:coverage` | Cobertura de ambos paquetes. |
| `npm run test:e2e` | Recorrido E2E. |
| `npm run test:e2e:ui` | E2E en la interfaz de Playwright. |

Los E2E quedan fuera de `npm test` porque requieren credenciales y datos externos preparados.

## Convenciones

- Ubicar cada archivo `.test.js` o `.test.jsx` junto al módulo cubierto.
- Reservar `test/` de cada paquete para configuración, fixtures y helpers compartidos.
- Probar reglas de negocio y comportamiento observable, no detalles internos ni estilos generados.
- Mantener los casos independientes y ejecutables en cualquier orden.
- Agregar un test de regresión para toda corrección de un defecto.
- Consultar el frontend como lo haría una persona, priorizando roles, nombres accesibles y eventos reales.
- Cubrir los errores y límites relevantes, no sólo el camino satisfactorio.

## Cobertura esperada

| Área | Escenarios mínimos |
|---|---|
| Reglas del backend | Prioridad de clasificación, responsables, validaciones y aislamiento por cuenta. |
| Integraciones del backend | Persistencia, paginación, concurrencia, caché y degradación ante fallos externos. |
| Contratos HTTP | Respuestas correctas y errores 400, 401, 403, 404, 409, 429, 502 y 503 cuando correspondan. |
| Frontend | Rutas, estados de carga/error/vacío, roles, stores, formularios e interacción por teclado. |
| Flujos críticos | Registro, sesión, configuración de GitLab, tablero, vista personal e invitación. |

La cobertura usa el proveedor `v8` y sirve para encontrar huecos; no hay un umbral global. El reporte HTML queda en `coverage/index.html` dentro de cada paquete.

## Infraestructura de test

### Backend

`createTestDatabase()` crea una instancia de PGlite por archivo y vacía sus tablas entre casos. Arrancarla es costoso, por eso dos llamadas dentro del mismo archivo devuelven la misma base reiniciada, no bases independientes.

Los test de rutas construyen Express en memoria con `createApp()`. Deben inyectar todos los servicios usados por la aplicación; si falta uno, `createApp()` intenta construirlo con la base configurada. `backend/test/auth.js` prepara una sesión y una cuenta, mientras que los dobles de GitLab y correo evitan cualquier acceso externo.

Toda la capa de datos es asíncrona: las aserciones sobre servicios y repositorios siempre esperan sus promesas.

### Frontend

Los stores viven a nivel de módulo. Cada caso los reinicia con `resetSharedState()` y, cuando necesita el tablero autenticado, usa `signInTestUser()`.

Las respuestas HTTP se enrutan por URL, no por orden de llamada, porque la aplicación puede solicitar sesión, cuenta y tablero en paralelo. Las actualizaciones se esperan con `act()`; con temporizadores falsos se usa `fireEvent`, y `user-event` queda para casos con reloj real.

## Test E2E

Antes de la primera ejecución, instalar Chromium:

```bash
npx playwright install chromium
```

Copiar `.env.example` de la raíz como `.env` y completar sus variables. Ese archivo es la fuente de verdad de la configuración E2E. Usar siempre proyectos de GitLab y una base de Neon dedicados a test; nunca datos de trabajo o producción.

Playwright levanta el backend en el puerto 3101 y el frontend en el 4173. `e2e/globalSetup.js` recrea únicamente los usuarios del recorrido para que cada ejecución empiece igual. El flujo verifica autenticación, configuración compartida, tablero real, actualización, vista personal, navegación, cierre de sesión e ingreso por invitación.

Los selectores usan `getByRole()` y `getByLabel()`, nunca clases de styled-components. La suite no crea, aprueba ni fusiona merge requests. Las trazas, capturas y videos se conservan sólo ante fallos o reintentos.

## Validación antes de entregar

Para cualquier cambio:

1. Ejecutar `npm test` y `npm run lint` desde la raíz.
2. Si cambia el frontend, ejecutar `npm run build --prefix frontend`.
3. Si cambia la documentación, ejecutar `npm run docs:build`.
4. Iniciar los paquetes afectados y revisar terminales y consola del navegador.

Para cambios de interfaz, además:

1. Verificar tema oscuro, estados de carga, error y vacío, y zoom al 200 %.
2. Recorrer la pantalla con teclado y comprobar orden y visibilidad del foco.
3. Revisar nombres, roles, regiones y anuncios dinámicos en el árbol de accesibilidad.
4. Comprobar contraste y `prefers-reduced-motion`.

El objetivo es WCAG 2.2 nivel AA; una declaración formal de conformidad requiere evaluar todas las pantallas y estados con tecnologías de asistencia reales.

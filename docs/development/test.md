# Estrategia de test

Fuente de verdad para ejecutar, escribir y validar los test. La elección de herramientas y sus consecuencias están en el [ADR 0003](../decisions/0003-estrategia-de-test.md).

## Estado y herramientas

- **Backend:** Vitest sobre Node.js.
- **Frontend:** Vitest, React Testing Library y `happy-dom`.
- **E2E:** Playwright Test sobre Chromium, pendiente de implementación.

Los test unitarios y de integración no acceden a GitLab. Los E2E recorren la aplicación completa contra proyectos reales dedicados a test y requieren `GITLAB_TOKEN`.

## Comandos

| Comando | Alcance |
|---|---|
| `npm test` en la raíz | Suites unitarias y de integración de ambos paquetes |
| `npm test` en `backend/` o `frontend/` | La suite de ese paquete |
| `npm run test:watch` en un paquete | Su suite en modo interactivo |
| `npm run typecheck` en `backend/` | Tipos de producción y de test |

Al incorporar Playwright, la raíz debe separar `test:unit` de `test:e2e` y dejar `test` apuntando al primero.

## Convenciones

- Ubicar cada test junto al módulo cubierto con el sufijo `.test.ts`, `.test.js` o `.test.jsx`, según el tipo de archivo.
- Reservar `test/` dentro de cada paquete para configuración, fixtures y utilidades compartidas.
- Priorizar reglas de negocio y comportamiento observable; evitar snapshots extensos y aserciones sobre clases de Tailwind.
- Mantener cada test independiente y ejecutable en cualquier orden.
- Agregar un test de regresión para toda corrección de un defecto.
- No usar la cobertura como único indicador: primero cubrir todas las ramas de clasificación y los contratos críticos.

## Backend

La suite debe cubrir la matriz y el orden de prioridad de `computeMergeability()`; las combinaciones de autor, reviewers y aprobadores de `computeResponsiblePeople()` junto con `collectPeople()`; la extracción de la ruta del proyecto; URLs, autenticación, errores y paginación del cliente de GitLab; el límite de concurrencia y la liberación de la cola ante fallos; el enriquecimiento, orden y degradación parcial de los merge requests; y `GET /health`, `GET /api/pull-requests`, la caché, `force=true` y la traducción de errores HTTP.

Los test de integración construyen Express en memoria con `createApp()`, inyectan la fuente de datos y el reloj cuando corresponde y reemplazan `global.fetch` con respuestas controladas. Los contratos de esas piezas están en la [arquitectura del backend](../architecture/backend.md).

`backend/tsconfig.json` excluye los test del build y `backend/tsconfig.test.json` los incluye en la validación de tipos.

## Frontend

Los test de componentes y del store deben cubrir la carga inicial, la actualización manual, el polling y los errores; los estados vacío, de carga y con datos anteriores; la agrupación por proyecto y el reparto en columnas; la expansión de proyectos; la información y los enlaces de tarjetas e indicadores; los roles, nombres accesibles, estados dinámicos e interacción por teclado; la presentación de responsables y columnas tal como los informa el backend; y la selección de persona, el filtrado personal y la conservación de la selección durante las actualizaciones.

Deben consultar el DOM como lo haría una persona usuaria, sin afirmar props de componentes hijos ni estado interno del store.

El store vive a nivel de módulo: cada test debe reiniciarlo con `resetSharedState()` de `frontend/test/sharedState.js`. Las actualizaciones asíncronas se esperan con `act()`. Con temporizadores falsos se usa `fireEvent`; `user-event` se reserva para test con reloj real.

La composición y el ciclo del store se detallan en la [arquitectura del frontend](../architecture/frontend.md).

## Test E2E

Playwright debe iniciar frontend y backend mediante `webServer` y correr contra proyectos de GitLab exclusivos para test. La suite debe fallar con un mensaje claro antes de comenzar si falta `GITLAB_TOKEN` o la configuración de proyectos.

El recorrido crítico inicial: abrir el tablero y esperar una respuesta real de GitLab, expandir un proyecto, verificar la columna y los bloqueadores de un merge request conocido, forzar una actualización y recorrer los controles principales con teclado.

Usar selectores accesibles como `getByRole()` y `getByLabel()`, con aserciones de espera automática; nunca localizar por clases de Tailwind. La configuración inicial ejecuta solo Chromium: Firefox y WebKit se agregan únicamente ante un requisito explícito. Conservar trazas, capturas y videos solo para fallos o reintentos.

Los datos deben ser controlados y estables: la suite no crea, modifica, aprueba ni fusiona merge requests salvo que un caso futuro lo requiera con limpieza segura.

## Validación antes de entregar

Para cualquier cambio:

1. Ejecutar `npm test` desde la raíz.
2. Si cambia el backend, ejecutar `npm run typecheck` y `npm run build` en `backend/`.
3. Si cambia el frontend, ejecutar `npm run build` en `frontend/`.
4. Iniciar los paquetes afectados y revisar terminales y consola del navegador.

Para cambios de interfaz, además:

1. Recorrer la página con `Tab`, `Shift+Tab`, `Enter` y `Espacio`, comprobando el enlace para saltar al contenido, el orden del foco y su visibilidad.
2. Verificar encabezados, regiones, nombres y estados en el árbol de accesibilidad, y los anuncios de carga, actualización, error y resultado vacío.
3. Validar contraste en tema oscuro, zoom al 200 % y la preferencia de movimiento reducido.

Esta revisión apunta a WCAG 2.2 nivel AA; una declaración formal de conformidad exige evaluar todas las pantallas y estados con tecnologías de asistencia reales.

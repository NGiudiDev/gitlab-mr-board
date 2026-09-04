# Estrategia de test

Fuente de verdad para ejecutar, escribir y validar los test. La elección de herramientas y sus consecuencias están en el [ADR 0003](../decisions/0003-estrategia-de-test.md).

## Estado y herramientas

- **Backend:** Vitest sobre Node.js.
- **Frontend:** Vitest, React Testing Library y `happy-dom`.
- **E2E:** Playwright Test sobre Chromium, en `e2e/`.

Los test unitarios y de integración no acceden a GitLab. Los E2E recorren la aplicación completa contra proyectos reales dedicados a test y requieren `GITLAB_TOKEN`.

## Comandos

| Comando | Alcance |
|---|---|
| `npm test` en la raíz | Suites unitarias y de integración de ambos paquetes |
| `npm test` en `backend/` o `frontend/` | La suite de ese paquete |
| `npm run test:watch` en un paquete | Su suite en modo interactivo |
| `npm run typecheck` en `backend/` | Tipos de producción y de test |
| `npm run test:e2e` en la raíz | Recorrido E2E contra GitLab real |
| `npm run test:e2e:ui` en la raíz | El mismo recorrido en el modo interactivo de Playwright |

`npm test` deja los E2E afuera a propósito: dependen de credenciales y de datos externos.

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

El recorrido vive en `e2e/tablero.spec.js` y se configura en `playwright.config.js`. Antes de la primera ejecución hay que descargar el navegador una vez:

```bash
npx playwright install chromium
```

Los E2E corren contra GitLab real, así que necesitan estas variables. Copiar `.env.example` de la raíz como `.env` —`e2e/config.js` lo carga si existe, y lo que ya esté en el entorno tiene prioridad, así que en CI alcanza con los secretos—. Si falta alguna variable, la suite falla con el detalle antes de levantar los servidores.

| Variable | Obligatoria | Uso |
|---|---:|---|
| `GITLAB_TOKEN` | Sí | PAT con alcance `read_api` sobre los proyectos de test |
| `E2E_PROJECT_IDS` | Sí | IDs de los proyectos dedicados a test, separados por comas |
| `E2E_PROJECT_PATH` | Sí | Ruta `grupo/proyecto` de la sección que expande el recorrido |
| `E2E_MR_TITLE` | Sí | Título exacto (mayúsculas incluidas) del merge request que se verifica |
| `E2E_MR_COLUMN` | Sí | Columna donde debe aparecer ese merge request |
| `E2E_GITLAB_BASE_URL` | No | Instancia de GitLab; por omisión `https://gitlab.com` |

Usar proyectos creados para test, nunca los de trabajo real: el recorrido depende de que ese merge request siga abierto y en su columna.

Playwright levanta ambos servicios con `webServer`, sin reutilizar procesos existentes: el backend en el puerto 3101 con `E2E_PROJECT_IDS` como `PROJECT_IDS`, y el build del frontend servido con `vite preview` en 4173, uno de los dos orígenes que acepta el CORS del backend.

El recorrido crítico abre el tablero y espera una respuesta real de GitLab, expande el proyecto configurado, verifica la columna y los bloqueadores del merge request conocido, fuerza una actualización que omite la caché y recorre los controles principales con teclado hasta la vista personal.

Para verlo correr: `npm run test:e2e:ui` abre el modo interactivo con watch y time-travel por paso, y `npm run test:e2e -- --headed` lo ejecuta en una ventana visible (`--debug` agrega el Inspector paso a paso). Las trazas de los reintentos se revisan después con `npx playwright show-trace`.

Usar selectores accesibles como `getByRole()` y `getByLabel()`, con aserciones de espera automática; nunca localizar por clases de Tailwind. Los paneles de proyecto contraídos se ocultan con `display: none`, así que sus tarjetas quedan fuera del árbol de accesibilidad hasta expandirlos.

Sólo se ejecuta Chromium: Firefox y WebKit se agregan únicamente ante un requisito explícito. Las trazas, capturas y videos se conservan solo para fallos o reintentos. La suite no crea, modifica, aprueba ni fusiona merge requests salvo que un caso futuro lo requiera con limpieza segura.

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

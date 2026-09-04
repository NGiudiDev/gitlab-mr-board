# Estrategia de pruebas

Este documento es la fuente de verdad para ejecutar, escribir y validar pruebas. La elección de herramientas y sus consecuencias se registran en el [ADR 0003](../decisions/0003-estrategia-de-pruebas.md).

## Estado y herramientas

Las pruebas unitarias y de integración están implementadas en ambos paquetes:

- **Backend:** Vitest sobre Node.js.
- **Frontend:** Vitest, React Testing Library y `happy-dom`.
- **E2E:** Playwright Test sobre Chromium, pendiente de implementación.

Las pruebas unitarias y de integración no acceden a GitLab. Las E2E deben recorrer la aplicación completa contra proyectos de prueba reales y requieren `GITLAB_TOKEN`.

## Comandos

| Comando | Alcance |
|---|---|
| `npm test` en la raíz | Ejecuta las suites unitarias y de integración de ambos paquetes |
| `npm test` en `backend/` | Ejecuta la suite del backend |
| `npm test` en `frontend/` | Ejecuta la suite del frontend |
| `npm run test:watch` en un paquete | Ejecuta su suite en modo interactivo |
| `npm run typecheck` en `backend/` | Valida los tipos de producción y pruebas |

Cuando se incorpore Playwright, la raíz debe exponer comandos separados:

```json
{
  "scripts": {
    "test": "npm run test:unit",
    "test:unit": "npm run test --prefix backend && npm run test --prefix frontend",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Convenciones

- Ubicar cada prueba junto al módulo cubierto con el sufijo `.test.ts`, `.test.js` o `.test.jsx`, según el tipo de archivo.
- Reservar `test/` dentro de cada paquete para configuración, fixtures y utilidades compartidas.
- Priorizar reglas de negocio y comportamiento observable sobre detalles internos.
- Evitar snapshots extensos y aserciones sobre clases de Tailwind.
- Mantener cada prueba independiente y ejecutable en cualquier orden.
- Agregar una prueba de regresión para toda corrección de un defecto.
- No depender de la cobertura como único indicador: primero cubrir todas las ramas de clasificación y los contratos críticos.

## Backend

La suite debe cubrir:

- La matriz completa y el orden de prioridad de `computeMergeability()`.
- Las combinaciones de autor, reviewers y aprobadores de `computeResponsiblePeople()`, y la lista de personas de `collectPeople()`.
- La extracción de la ruta del proyecto.
- La construcción de URLs, autenticación, errores y paginación del cliente de GitLab.
- El límite de concurrencia y la liberación de la cola ante fallos.
- El enriquecimiento, orden y degradación parcial de los merge requests.
- `GET /health`, `GET /api/pull-requests`, la caché, `force=true` y la traducción de errores HTTP.

Las pruebas de integración construyen Express en memoria mediante `createApp()`. Deben inyectar la fuente de datos y el reloj cuando corresponda, y reemplazar `global.fetch` con respuestas controladas. Los contratos de estas piezas se describen en la [arquitectura del backend](../architecture/backend.md).

`backend/tsconfig.json` excluye las pruebas del build y `backend/tsconfig.test.json` las incluye en la validación de tipos.

## Frontend

Las pruebas de componentes y del store deben cubrir:

- Carga inicial, actualización manual, polling y errores.
- Estados vacío, de carga y con datos anteriores.
- Agrupación por proyecto y clasificación en columnas.
- Expansión y contracción de proyectos.
- Información y enlaces de tarjetas e indicadores.
- Roles, nombres accesibles, estados dinámicos e interacción por teclado.
- Presentación de los responsables y las columnas que informa el backend, sin recalcular sus reglas.
- Selección de persona, filtrado personal y conservación de la selección durante actualizaciones.

Las pruebas deben consultar el DOM como lo haría una persona usuaria. No deben afirmar props de componentes hijos ni el estado interno del store.

El store vive a nivel de módulo: cada prueba debe reiniciarlo con `resetSharedState()` de `frontend/test/sharedState.js`. Las actualizaciones asíncronas se esperan con `act()`. Con temporizadores falsos se usa `fireEvent`; `user-event` se reserva para pruebas con reloj real.

La composición y el ciclo del store se detallan en la [arquitectura del frontend](../architecture/frontend.md).

## Pruebas E2E

Playwright debe iniciar frontend y backend mediante `webServer` y ejecutar el recorrido contra proyectos de GitLab exclusivos para pruebas. La suite debe fallar con un mensaje claro antes de comenzar si falta `GITLAB_TOKEN` o la configuración de proyectos.

El recorrido crítico inicial es:

1. Abrir el tablero y esperar una respuesta real de GitLab.
2. Expandir un proyecto.
3. Verificar la columna y los bloqueadores de un merge request conocido.
4. Forzar una actualización.
5. Recorrer los controles principales con teclado.

Usar selectores accesibles como `getByRole()` y `getByLabel()`, junto con aserciones con espera automática. No localizar elementos mediante clases de Tailwind.

La configuración inicial ejecuta solo Chromium. Firefox y WebKit se agregan únicamente ante un requisito explícito. Conservar trazas, capturas y videos solo para fallos o reintentos.

Los datos E2E deben ser controlados y estables. La suite no debe crear, modificar, aprobar ni fusionar merge requests salvo que un caso futuro lo requiera expresamente y disponga de limpieza segura.

## Validación antes de entregar

Para cualquier cambio:

1. Ejecutar `npm test` desde la raíz.
2. Si cambia el backend, ejecutar `npm run typecheck` y `npm run build` en `backend/`.
3. Si cambia el frontend, ejecutar `npm run build` en `frontend/`.
4. Iniciar los paquetes afectados y revisar terminales y consola del navegador.

Para cambios de interfaz, además:

1. Recorrer la página con `Tab`, `Shift+Tab`, `Enter` y `Espacio`.
2. Comprobar el enlace para saltar al contenido, el orden del foco y su visibilidad.
3. Verificar encabezados, regiones, nombres y estados en el árbol de accesibilidad.
4. Confirmar los anuncios de carga, actualización, error y resultado vacío.
5. Validar contraste en tema oscuro y zoom al 200 %.
6. Probar la preferencia de movimiento reducido.

Esta revisión apunta a WCAG 2.2 nivel AA, pero una declaración formal de conformidad requiere evaluar todas las pantallas y estados con tecnologías de asistencia reales.

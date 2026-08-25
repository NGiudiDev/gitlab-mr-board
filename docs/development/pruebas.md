# Estrategia de pruebas

## Estado actual

El proyecto todavía no tiene framework, archivos de pruebas ni scripts `test`; por lo tanto, `npm test` no es un comando válido. El backend cuenta con `npm run typecheck` y ambos paquetes cuentan con `npm run build` como verificaciones estáticas.

## Recomendación

Adoptar **Vitest como ejecutor de pruebas unitarias y de integración** para backend y frontend. En el frontend se complementa con **Vue Test Utils 2** y un entorno DOM liviano para montar componentes Vue 3. Para las pruebas de extremo a extremo se debe usar **Playwright Test**. Esta combinación cubre cada nivel con una herramienta adecuada sin usar el navegador para reglas que pueden comprobarse de forma más rápida y aislada.

Las versiones vigentes de estas herramientas ya no admiten el Node.js 18 que utiliza el proyecto; Playwright requiere una versión reciente con soporte activo. La implementación debe comenzar elevando el mínimo a **Node.js 22** de forma coordinada en `package.json`, `backend/package.json`, `backend/scripts/check-node-version.cjs`, `AGENTS.md`, `README.md` y las guías de desarrollo y despliegue. No se deben fijar versiones antiguas de las herramientas solo para conservar el runtime actual.

Esta página define el destino recomendado; todavía no implica que las dependencias o scripts estén instalados.

## Pirámide propuesta

### 1. Pruebas unitarias de reglas de negocio

Son la primera prioridad porque la clasificación de un Merge Request determina en qué columna aparece. Conviene extraer y exportar las funciones puras que hoy están dentro de `mergeRequestService.ts`, sin cambiar su comportamiento.

Casos mínimos para `computeMergeability`:

- `backlog` tiene prioridad sobre los demás estados.
- draft o work in progress resulta en `gray`.
- `qa_pending` resulta en `qa`.
- conflictos, discusiones abiertas y pipelines fallidos o cancelados resultan en `yellow`.
- pipelines en ejecución o pendientes resultan en `yellow`.
- aprobaciones pendientes resultan en `review`.
- sin la etiqueta `qa_approved` resulta en `yellow`.
- con aprobaciones, pipeline y QA correctos resulta en `green`.
- las etiquetas se comparan sin distinguir mayúsculas de minúsculas.

También deben cubrirse `extractProjectPath`, la construcción de URLs de GitLab, la paginación y el rate limiter. Estas pruebas no acceden a la red ni dependen de un token real.

### 2. Pruebas de integración del backend

Ejecutar la aplicación Express en memoria y reemplazar `global.fetch` por respuestas controladas. Verificar el contrato observable, no detalles internos:

- `GET /health` devuelve un estado exitoso.
- `GET /api/pull-requests` enriquece y ordena los MRs.
- una segunda petición dentro del TTL utiliza caché.
- `?force=true` evita la caché.
- errores de GitLab se traducen al código HTTP y mensaje en español esperados.
- respuestas 401, 404, paginadas y parcialmente incompletas se manejan correctamente.
- el token nunca aparece en el cuerpo ni en logs capturados por las pruebas.

Los datos de GitLab deben vivir en fixtures pequeñas y explícitas. No usar la API real en la suite repetible: sería lenta, consumiría rate limit y volvería los resultados dependientes de datos externos.

### 3. Pruebas de componentes y composables

Montar los componentes con Vue Test Utils y comprobar su comportamiento desde la perspectiva de una persona usuaria:

- búsqueda por título, autor, rama y proyecto;
- agrupación de tarjetas en la columna correcta;
- estados de carga, error, vacío y actualización;
- expansión y contracción de proyectos;
- textos accesibles, roles, nombres de controles y anuncios dinámicos;
- interacción por teclado y foco visible donde pueda verificarse en DOM.

Mockear `fetch`, fechas e intervalos en `useMergeRequests`. Evitar aserciones sobre clases Tailwind o estado interno cuando se pueda afirmar texto, atributos accesibles, eventos o contenido renderizado. Reservar snapshots para estructuras pequeñas y estables.

### 4. Pruebas de extremo a extremo con Playwright

Cuando las tres capas anteriores estén estables, agregar pruebas con Playwright Test y un servidor de API simulado. Playwright debe iniciar el frontend y el backend mediante la opción `webServer` de su configuración, o iniciar solamente el frontend cuando todas las respuestas se intercepten desde el navegador.

Recorrido crítico inicial:

1. abrir el tablero;
2. esperar la carga de fixtures;
3. buscar un MR;
4. comprobar su columna y bloqueadores;
5. forzar una actualización;
6. recorrer los controles principales por teclado.

Usar `page.route()` para responder las llamadas a `/api/pull-requests` con fixtures locales. La suite no debe comunicarse con GitLab ni requerir `GITLAB_TOKEN`. Priorizar `getByRole()`, `getByLabel()` y aserciones con espera automática; no localizar elementos por clases Tailwind. Cada prueba debe ser independiente y poder ejecutarse en cualquier orden.

La configuración inicial debe ejecutar solamente Chromium para mantener bajo el tiempo de instalación y de integración continua. Firefox y WebKit se agregarán cuando exista una necesidad explícita de compatibilidad entre navegadores. Conservar trazas, capturas y videos solo ante fallos o reintentos.

No conviene empezar la adopción por esta capa: es más costosa y no localiza fallas de reglas tan bien como las pruebas unitarias.

## Estructura y comandos objetivo

Mantener las pruebas junto al código que cubren con el sufijo `.test.ts` o `.test.js`. Los fixtures compartidos pueden ubicarse en una carpeta `test/fixtures/` dentro de cada paquete.

Una vez implementada la infraestructura, cada `package.json` debe exponer:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

La raíz debe agregar comandos separados para que el propósito de cada ejecución sea explícito:

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

En integración continua se deben ejecutar ambas capas de forma explícita:

```bash
npm run test:unit
npm run test:e2e
```

No establecer un porcentaje global de cobertura al inicio. Primero cubrir todas las ramas de clasificación y los contratos HTTP críticos; después medir una línea base y subir el umbral gradualmente. La cobertura es una señal, no el criterio de calidad por sí sola.

## Plan de adopción

1. Elevar el mínimo a Node.js 22 e instalar Vitest en ambos paquetes; agregar Vue Test Utils y el entorno DOM solo al frontend.
2. Extraer las reglas puras sin cambiar comportamiento y cubrir la matriz completa de mergeabilidad.
3. Hacer inyectables la llamada a GitLab y el reloj de la caché; agregar integración del backend.
4. Cubrir `useMergeRequests`, `MrBoard`, `BoardColumn` y `MrCard` por comportamiento.
5. Instalar Playwright Test en la raíz, descargar Chromium y agregar el recorrido crítico con la API simulada.
6. Ejecutar las suites unitarias y E2E como pasos separados en integración continua.

Cada etapa debe dejar `npm test`, typecheck y builds en verde. Una corrección de defecto debe incluir primero una prueba que reproduzca la regresión.

## Validación manual mientras no exista la suite

1. Ejecutar `npm run check:node`, `npm run typecheck` y `npm run build` en `backend/`.
2. Iniciar el backend y comprobar `GET /health` y `GET /api/pull-requests`.
3. Iniciar el frontend y verificar carga, búsqueda, agrupación, columnas y actualización manual.
4. Revisar consola del navegador y terminales.
5. Ejecutar `npm run build` en `frontend/`.
6. Para cambios de clasificación, cubrir draft, conflictos, pipelines, aprobaciones, QA y backlog.

## Validación manual de accesibilidad

Para cada cambio de interfaz:

1. Recorrer la página solo con `Tab`, `Shift+Tab`, `Enter` y `Espacio`; el orden debe ser lógico, todo control debe funcionar y el foco debe permanecer visible.
2. Activar “Saltar al contenido principal” y comprobar que mueve el foco al tablero.
3. Verificar con el árbol de accesibilidad que existe un único `main`, una jerarquía de encabezados coherente, nombre para el buscador y estado expandido o contraído para cada proyecto.
4. Confirmar que carga, actualización, error y resultado vacío se anuncian sin mover el foco.
5. Medir contraste en tema oscuro: 4.5:1 para texto normal y 3:1 para controles, foco e información gráfica.
6. Probar zoom del navegador al 200 % y preferencia de movimiento reducido sin pérdida de contenido ni funcionalidad.

Esta revisión es una base técnica orientada a WCAG 2.2 AA; una declaración formal de conformidad requiere evaluar todas las pantallas y estados con pruebas manuales y tecnologías de asistencia reales.

## Referencias

- [Guía oficial de Vitest](https://vitest.dev/guide/)
- [Guía oficial de Vue Test Utils](https://test-utils.vuejs.org/guide/)
- [Instalación oficial de Playwright](https://playwright.dev/docs/intro)
- [Buenas prácticas oficiales de Playwright](https://playwright.dev/docs/best-practices)

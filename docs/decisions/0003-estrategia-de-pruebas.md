# ADR 0003: adoptar Vitest y una pirámide de pruebas sin GitLab real

- Estado: aceptada
- Fecha: 2026-09-02

## Contexto

La clasificación de un Merge Request decide en qué columna aparece, y hasta ahora sólo se verificaba a mano contra la instancia real de GitLab. Esa validación es lenta, consume rate limit, exige un token y depende de datos que cambian, así que una regresión en las reglas o en el contrato HTTP podía pasar inadvertida. El proyecto es intencionalmente liviano y combina TypeScript con ES modules en el backend y Vue 3 con Vite en el frontend, por lo que conviene una única herramienta que funcione en ambos paquetes.

## Decisión

Adoptar **Vitest** como ejecutor de pruebas unitarias y de integración en backend y frontend, complementado con **Vue Test Utils 2** y el entorno `happy-dom` para montar componentes Vue, y reservar **Playwright Test** para la capa de extremo a extremo.

La estrategia se organiza en cuatro niveles: reglas puras, integración del backend con la app Express en memoria, componentes y composables desde la perspectiva de la persona usuaria, y E2E sobre el recorrido crítico. Las tres primeras están implementadas; la cuarta queda pendiente.

Reglas que acompañan la decisión:

- Ninguna suite repetible usa la API real de GitLab ni requiere `GITLAB_TOKEN`: las respuestas se simulan con fixtures locales.
- Las pruebas viven junto al código que cubren con sufijo `.test.ts` o `.test.js`, y los fixtures y utilidades compartidas en la carpeta `test/` de cada paquete.
- Se prioriza el comportamiento observable —texto, roles, atributos accesibles, contrato HTTP— por sobre clases Tailwind, estado interno o snapshots extensos.
- Toda corrección de un defecto agrega primero una prueba de regresión.
- No se fija un umbral global de cobertura al inicio: primero se cubren todas las ramas de clasificación y los contratos críticos.

Para hacer testeable el backend se aceptaron tres cambios de estructura sin alterar el comportamiento: las reglas puras se movieron a `src/services/mergeRequestRules.ts`, la aplicación Express se construye con `createApp()` en `src/app.ts` mientras `src/index.ts` sólo escucha el puerto, y el router recibe por inyección la fuente de datos y el reloj de la caché.

El detalle operativo —archivos, casos cubiertos, comandos y plan de adopción— vive en [`docs/development/pruebas.md`](../development/pruebas.md).

## Consecuencias

Las reglas de negocio y el contrato HTTP quedan verificados en segundos y sin credenciales, y `npm test` en la raíz corre ambas suites. El costo es mantener fixtures que reflejen la forma de las respuestas de GitLab: si la API cambia, las pruebas siguen en verde y el desfase sólo aparece en la validación manual, que por eso se conserva como paso complementario. La inyección de dependencias y la separación entre `app.ts` e `index.ts` agregan una capa de indirección que hay que respetar al sumar rutas o servicios. Elevar el mínimo a Node.js 22 y npm 10 es requisito de estas herramientas. Mientras falte la capa E2E, ninguna prueba automatizada cubre el navegador real ni la integración completa entre frontend y backend.

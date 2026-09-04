# ADR 0004: generar un sitio de documentación con VitePress

- Estado: aceptada
- Fecha: 2026-09-02

## Contexto

`docs/` reúne archivos Markdown organizados por propósito, con índices por carpeta y enlaces relativos entre documentos. Leerlos exige navegar el repositorio archivo por archivo: no hay búsqueda entre documentos, la jerarquía sólo se ve abriendo cada índice y nada verifica que los enlaces relativos sigan apuntando a donde dicen. La documentación ya es un producto del proyecto —AGENTS.md obliga a actualizarla junto con el comportamiento— pero no tiene una superficie de lectura propia.

## Decisión

Generar un sitio estático desde `docs/` con **VitePress**, agregado como dependencia de desarrollo en la raíz.

Se eligió sobre las alternativas por coherencia de herramientas: VitePress pertenece al ecosistema de Vite y se ejecuta con el runtime de Node.js que ya usa el repositorio. MkDocs Material incorporaría una cadena de Python y Docsify renderiza en el navegador sin HTML pregenerado ni búsqueda comparable.

Reglas que acompañan la decisión:

- La configuración vive en `docs/.vitepress/config.mjs`, dentro de la carpeta de documentación centralizada que exige AGENTS.md.
- Los índices siguen llamándose `README.md` para que se rendericen al navegar el repositorio; `rewrites` los sirve como `index.md` en el sitio.
- El sidebar se declara a mano en lugar de autogenerarse: con cinco secciones es más explícito y obliga a decidir con qué título aparece cada página.
- `ignoreDeadLinks` queda en `false`: un enlace roto entre documentos rompe el build en vez de pasar desapercibido.
- La búsqueda es local, con índice estático, sin depender de un servicio externo.
- El sitio se genera bajo demanda y se lee local; no se publica en ningún hosting. `DOCS_BASE` ajusta la ruta base si alguna vez se sirve desde un subdirectorio.

El Markdown no cambia: los documentos se siguen escribiendo igual y se leen igual en el repositorio.

## Consecuencias

La documentación gana búsqueda y navegación por secciones, y el build actúa como verificación de integridad de los enlaces internos. El costo es una dependencia de desarrollo con su árbol transitivo y la obligación de sumar cada documento nuevo al sidebar —si se olvida, la página existe pero queda fuera de la navegación—. Como no hay publicación automática, el sitio sólo existe para quien lo levanta: el repositorio sigue siendo la fuente de lectura por defecto. Si más adelante se publica, todo lo que esté en `docs/` pasa a ser público.

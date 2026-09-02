# GitLab MR Board

GitLab MR Board es un tablero web que reúne los Merge Requests abiertos de varios proyectos de GitLab y los organiza según su estado de mergeabilidad. Muestra aprobaciones, discusiones pendientes, pipelines, conflictos y responsables sin exponer el token de GitLab en el navegador.

La interfaz incluye navegación por teclado, foco visible, anuncios para lectores de pantalla y una paleta de alto contraste orientada a WCAG 2.2 nivel AA.

## Documentación

Requisitos, puesta en marcha, pruebas, build y arquitectura viven en [`docs/`](docs/README.md), que es la única fuente de verdad documental.

Esta carpeta también está disponible en la web. Para más información, consultar [ADR 0004](docs/decisions/0004-sitio-de-documentacion.md).

Para ejecutarlo desde la raíz del proyecto:


```bash
npm run docs:dev
```

| Sección | Contenido |
|---|---|
| [Arquitectura](docs/architecture/README.md) | Estructura, componentes y flujo de datos |
| [Decisiones](docs/decisions/README.md) | Decisiones técnicas y sus consecuencias |
| [Desarrollo](docs/development/README.md) | Entorno local, comandos y pruebas |
| [Despliegue](docs/deployment/README.md) | Build y operación en producción |
| [Dominios](docs/domains/README.md) | Reglas del dominio de Merge Requests |

Las reglas para contribuir están en [`AGENTS.md`](AGENTS.md).

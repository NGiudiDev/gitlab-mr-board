# ADR 0003: adoptar Vitest y una pirámide de test

- Estado: aceptada
- Fecha: 2026-09-02

## Contexto

Las reglas de clasificación y el contrato HTTP necesitan validaciones rápidas y deterministas. A la vez, el recorrido completo debe comprobar la integración real con GitLab, porque los fixtures no detectan cambios en su API.

## Decisión

Usar **Vitest** para los test unitarios y de integración de ambos paquetes, **React Testing Library** con `happy-dom` para los componentes y **Playwright Test** para los test de extremo a extremo. Los niveles bajos aíslan la red con fixtures; los E2E requieren `GITLAB_TOKEN` y proyectos de GitLab dedicados.

La estructura, los casos, las convenciones y los comandos pertenecen a la [estrategia de test](../development/test.md).

## Consecuencias

Las capas aisladas localizan regresiones con rapidez y sin credenciales. La capa E2E detecta problemas de integración que los fixtures no representan, a cambio de mayor duración, consumo de rate limit y dependencia de datos externos controlados. La arquitectura debe conservar funciones puras e inyección de dependencias para que los niveles bajos sigan siendo deterministas.

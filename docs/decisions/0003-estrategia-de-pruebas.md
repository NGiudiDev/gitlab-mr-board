# ADR 0003: adoptar Vitest y una pirámide de pruebas

- Estado: aceptada
- Fecha: 2026-09-02

## Contexto

Las reglas de clasificación y el contrato HTTP necesitan validaciones rápidas y deterministas. A la vez, el recorrido completo debe comprobar la integración real con GitLab, porque los fixtures no detectan cambios en su API.

## Decisión

Usar **Vitest** para las pruebas unitarias y de integración de ambos paquetes, **React Testing Library** con `happy-dom` para los componentes y **Playwright Test** para las pruebas de extremo a extremo.

Las pruebas unitarias y de integración aíslan la red con fixtures. Las E2E recorren la aplicación completa contra proyectos de prueba en GitLab y requieren `GITLAB_TOKEN`. En todos los niveles se prioriza el comportamiento observable y cada corrección de un defecto incluye una prueba de regresión.

La estructura, los casos y los comandos pertenecen a la [estrategia de pruebas](../development/pruebas.md).

## Consecuencias

Las capas aisladas localizan regresiones con rapidez y sin credenciales. La capa E2E detecta problemas de integración que los fixtures no representan, a cambio de mayor duración, consumo de rate limit y dependencia de datos externos controlados. La arquitectura debe conservar funciones puras e inyección de dependencias para que las pruebas de menor nivel sigan siendo deterministas.

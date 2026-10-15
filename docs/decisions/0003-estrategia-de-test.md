# ADR 0003: Estrategia de test

- Estado: Aceptada
- Fecha: 2026-09-02

## Contexto

El proyecto reúne reglas de negocio con muchas combinaciones, rutas HTTP con autenticación y permisos, persistencia en PostgreSQL, estado asíncrono en React e integración con GitLab. Un defecto puede aparecer en una función aislada, en la composición entre capas o sólo cuando todos los servicios reales trabajan juntos.

La validación habitual debe ser rápida, determinista y ejecutable sin credenciales ni red para dar feedback durante el desarrollo. Sin embargo, aislar todas las dependencias tampoco alcanza: los fixtures no detectan cambios en la API de GitLab, errores de configuración ni fallos en el recorrido completo del navegador.

Se necesita combinar muchos test baratos y localizados con pocos recorridos reales de mayor costo.

## Decisión

Adoptar una pirámide de test con tres niveles:

1. **Unitarios:** validan reglas puras, validaciones y utilidades con entradas controladas y sin operaciones externas.
2. **Integración:** comprueban la colaboración entre módulos. El backend construye Express en memoria, reemplaza GitLab y el correo con dobles controlados y ejecuta los repositorios contra PGlite para validar el esquema, las consultas y las restricciones de PostgreSQL sin conectarse a Neon. El frontend prueba componentes y stores desde el comportamiento observable, reemplazando las respuestas HTTP.
3. **Extremo a extremo:** Playwright recorre un camino crítico en Chromium contra el frontend y el backend completos, una base de Neon separada y proyectos reales de GitLab dedicados a test.

Usar **Vitest** como runner común de backend y frontend, y **React Testing Library** con `happy-dom` para interactuar con los componentes como lo haría una persona usuaria. Usar **Playwright Test** únicamente para los E2E.

`npm test` ejecuta los niveles unitario y de integración sin acceder a GitLab ni a Neon. Los E2E se ejecutan aparte porque requieren credenciales, datos externos preparados y más tiempo. La cobertura es una herramienta de diagnóstico, no un objetivo suficiente por sí mismo: no se fija un umbral global y se priorizan las reglas, contratos y riesgos críticos.

El código debe favorecer esta estrategia mediante funciones puras e inyección de las dependencias externas y del reloj. Toda corrección de un defecto incorpora un test de regresión en el nivel más bajo capaz de reproducirlo.

Los comandos, la organización de archivos, los casos obligatorios y la preparación de los E2E pertenecen a la [estrategia de test](../development/test.md).

## Alternativas consideradas

- **Cubrir todo con E2E:** ofrece alta fidelidad, pero vuelve la suite lenta, frágil ante datos externos y poco precisa para localizar fallos.
- **Usar sólo test unitarios y dobles:** maximiza la velocidad, pero no comprueba el cableado de Express, el esquema y las consultas de los repositorios, el comportamiento del navegador ni la compatibilidad real con GitLab.
- **Consultar GitLab y Neon desde los test de integración:** aumenta el realismo, pero introduce credenciales, latencia, rate limits y estado compartido en la suite que debe ser determinista.
- **Usar runners distintos en cada paquete:** permite elegir una herramienta especializada por entorno, pero duplica configuración y convenciones sin aportar una ventaja necesaria. Vitest cubre ambos paquetes y comparte el ecosistema de Vite.

## Consecuencias

### Positivas

- La suite habitual es rápida, repetible y no necesita secretos, red ni servicios locales adicionales.
- Los fallos se detectan cerca de la capa responsable y resultan más fáciles de diagnosticar.
- PGlite verifica el esquema, las consultas y las restricciones de los repositorios sin reemplazar la base con mocks.
- Los E2E conservan una comprobación real del contrato con GitLab y del recorrido principal de la aplicación.
- Compartir Vitest reduce configuración y diferencias entre paquetes.

### Negativas

- Los fixtures y dobles deben mantenerse alineados con los contratos externos; por sí solos pueden ocultar cambios de GitLab.
- PGlite reproduce el comportamiento de PostgreSQL necesario para los test, pero no las características operativas de Neon como servicio administrado.
- Los E2E son más lentos, consumen rate limit y dependen de credenciales y datos dedicados que hay que mantener.
- Ejecutar E2E sólo en Chromium no garantiza compatibilidad con todos los motores de navegador.
- La inyección de dependencias y la separación de reglas puras agregan diseño explícito al código de producción.

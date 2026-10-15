# Arquitectura

La arquitectura se documenta desde tres puntos de vista. Cada página resume responsabilidades, límites y flujos; las reglas específicas permanecen en la documentación de cada dominio.

## Producto

[Producto](producto.md) explica qué resuelve el tablero, quién puede hacer cada cosa y cómo colaboran el navegador, el backend, GitLab y Neon.

## Backend

[Backend](backend.md) describe el BFF, la organización por features, el acceso a datos, la integración con GitLab y el manejo de errores.

## Frontend

[Frontend](frontend.md) presenta la aplicación React, sus pantallas, la dirección de dependencias, los stores y las decisiones visuales y de accesibilidad.

Las decisiones que justifican esta estructura están en los [ADR](../decisions/). Las reglas funcionales vigentes están en [Dominios](../domains/).

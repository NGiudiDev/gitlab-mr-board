# Estrategia de pruebas

No hay framework, archivos de tests ni scripts `test`; `npm test` no es válido actualmente. El backend cuenta con `npm run typecheck` como verificación estática.

## Validación manual mínima

1. Ejecutar `npm run typecheck` y `npm run build` en `backend/`.
2. Iniciar el backend y comprobar `GET /health`.
3. Iniciar el frontend y verificar carga, búsqueda, agrupación, columnas y actualización manual.
4. Revisar consola del navegador y terminales.
5. Ejecutar `npm run build` en `frontend/`.
6. Para cambios de clasificación, cubrir draft, conflictos, pipelines, aprobaciones, QA y backlog.

## Validación de accesibilidad

Para cada cambio de interfaz:

1. Recorrer la página solo con `Tab`, `Shift+Tab`, `Enter` y `Espacio`; el orden debe ser lógico, todo control debe funcionar y el foco debe permanecer visible.
2. Activar “Saltar al contenido principal” y comprobar que mueve el foco al tablero.
3. Verificar con el árbol de accesibilidad que existe un único `main`, una jerarquía de encabezados coherente, nombre para el buscador y estado expandido/contraído para cada proyecto.
4. Confirmar que carga, actualización, error y resultado vacío se anuncian sin mover el foco.
5. Medir contraste en tema oscuro: 4.5:1 para texto normal y 3:1 para controles, foco e información gráfica.
6. Probar zoom del navegador al 200 % y preferencia de movimiento reducido sin pérdida de contenido ni funcionalidad.

Esta revisión es una base técnica orientada a WCAG 2.2 AA; una declaración formal de conformidad requiere evaluar todas las pantallas y estados con pruebas manuales y tecnologías de asistencia reales.

Queda pendiente incorporar tests unitarios de reglas, tests de integración de API y tests de componentes.

El comando `npm run check:node` en `backend/` debe finalizar correctamente. Para probar la protección de compatibilidad sin cambiar el runtime instalado, revisar que `engines.node` y `minimumMajorVersion` continúen sincronizados en 18.

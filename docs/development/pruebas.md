# Estrategia de pruebas

No hay framework, archivos de tests ni scripts `test`; `npm test` no es válido actualmente. El backend cuenta con `npm run typecheck` como verificación estática.

## Validación manual mínima

1. Ejecutar `npm run typecheck` y `npm run build` en `backend/`.
2. Iniciar el backend y comprobar `GET /health`.
3. Iniciar el frontend y verificar carga, búsqueda, agrupación, columnas y actualización manual.
4. Revisar consola del navegador y terminales.
5. Ejecutar `npm run build` en `frontend/`.
6. Para cambios de clasificación, cubrir draft, conflictos, pipelines, aprobaciones, QA y backlog.

Queda pendiente incorporar tests unitarios de reglas, tests de integración de API y tests de componentes.

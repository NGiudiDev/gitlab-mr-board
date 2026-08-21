# Estrategia de pruebas

No hay framework, archivos de tests ni scripts `test`; `npm test` no es válido actualmente.

## Validación manual mínima

1. Iniciar el backend y comprobar `GET /health`.
2. Iniciar el frontend y verificar carga, búsqueda, agrupación, columnas y actualización manual.
3. Revisar consola del navegador y terminales.
4. Ejecutar `npm run build` en `frontend/`.
5. Para cambios de clasificación, cubrir draft, conflictos, pipelines, aprobaciones, QA y backlog.

Queda pendiente incorporar tests unitarios de reglas, tests de integración de API y tests de componentes.

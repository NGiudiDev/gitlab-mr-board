# Calidad de código

Las reglas generales para contribuir están en `AGENTS.md`. Esta página conserva únicamente las convenciones de formato y ejecución que necesitan más detalle.

## Estilo de código

ESLint exige comillas dobles y punto y coma. Los componentes usan exports nombrados; `export default` queda para integraciones que lo requieren.

En el frontend, los imports se agrupan en este orden, omitiendo grupos vacíos:

1. Paquetes externos.
2. Módulos compartidos de `app/`.
3. Módulos de otras features.
4. Módulos de la feature actual.

Cada grupo se separa con una línea en blanco. Dentro de un componente se declaran props, hooks, valores derivados, handlers y efectos antes del retorno, respetando siempre las dependencias entre declaraciones.

En JSX, una línea en blanco separa bloques hermanos con funciones distintas; los elementos que forman una unidad permanecen juntos. Los comentarios explican decisiones no evidentes, nunca el contenido que ya expresa el código.

La [arquitectura del frontend](../architecture/frontend.md#dirección-de-dependencias) define dónde vive cada responsabilidad. Las pages son el borde habitual para coordinar features; las utilidades y constantes se comparten sólo cuando tienen más de un consumidor real.

## Operaciones asíncronas

Todo `useEffect` con peticiones, suscripciones o temporizadores debe ser idempotente bajo `StrictMode` y liberar sus recursos al desmontar.

- Una petición local usa `AbortController` y descarta `AbortError`.
- Un store compartido reutiliza la promesa en curso y detiene sus recursos al perder el último consumidor.
- Una respuesta anterior nunca puede sobrescribir el estado de una solicitud más nueva.
- URL base, cookies, serialización, lectura de errores y expiración de sesión son responsabilidades de transporte; el hook decide cómo representa el resultado en su feature.

## Herramientas

| Comando | Uso |
|---|---|
| `npm run lint` | Valida el código sin modificar archivos. |
| `npm run lint:fix` | Aplica las correcciones automáticas de ESLint. |

VS Code recomienda la extensión oficial de ESLint mediante `.vscode/extensions.json`. La configuración del repositorio ejecuta `source.fixAll.eslint` al guardar y mantiene `editor.formatOnSave` desactivado para no aplicar dos formateadores distintos.

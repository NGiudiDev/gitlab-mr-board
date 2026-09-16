# Calidad de código

## Estilo de código

ESLint exige comillas dobles para los strings y punto y coma al final de cada sentencia. Ambas reglas se aplican automáticamente con `npm run lint:fix`.

Los componentes publican exports nombrados. `export default` queda reservado para integraciones que lo exijan, como ciertos archivos de configuración. Cada componente conserva una sola responsabilidad; una parte se extrae cuando tiene un contrato propio o permite reutilización real, no sólo para reducir la cantidad de líneas.

## Comandos

| Comando | Uso |
|---|---|
| `npm run lint` | Valida el código sin modificar archivos |
| `npm run lint:fix` | Corrige comillas, punto y coma y exports automáticamente |

## VS Code

El repositorio recomienda la extensión oficial ESLint mediante `.vscode/extensions.json`. `.vscode/settings.json` ejecuta `source.fixAll.eslint` en cada guardado.

`editor.formatOnSave` permanece desactivado porque ESLint aplica el cambio como una acción de código, no como formateo.

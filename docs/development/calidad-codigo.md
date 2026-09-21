# Calidad de código

## Estilo de código

ESLint exige comillas dobles para los strings y punto y coma al final de cada sentencia. Ambas reglas se aplican automáticamente con `npm run lint:fix`.

Los componentes publican exports nombrados. `export default` queda reservado para integraciones que lo exijan, como ciertos archivos de configuración. Cada componente conserva una sola responsabilidad; una parte se extrae cuando tiene un contrato propio o permite reutilización real, no sólo para reducir la cantidad de líneas.

En el frontend, ordenar los imports por origen: paquetes externos, módulos compartidos de `app/`, módulos de otras features y módulos de la feature actual. Omitir los grupos vacíos, separar los presentes con una línea en blanco y mantener juntos los imports del mismo origen. Dentro de cada componente, colocar primero las props, después los hooks y valores derivados, luego los handlers y efectos, y al final los retornos. Conservar el orden que exijan los hooks y las dependencias entre declaraciones.

En JSX, separar con una línea en blanco los bloques hermanos que cumplen funciones distintas, como el encabezado y su descripción, las alertas, los campos y las secciones de una page. Mantener juntos los elementos que forman una unidad, como un `dt` con su `dd` o una etiqueta con su ayuda. No dejar espacios en líneas vacías ni agregar comentarios que repitan el nombre o el contenido evidente del componente; los comentarios explican decisiones que el código no muestra por sí solo.

## Comandos

| Comando | Uso |
|---|---|
| `npm run lint` | Valida el código sin modificar archivos |
| `npm run lint:fix` | Corrige comillas, punto y coma y exports automáticamente |

## VS Code

El repositorio recomienda la extensión oficial ESLint mediante `.vscode/extensions.json`. `.vscode/settings.json` ejecuta `source.fixAll.eslint` en cada guardado.

`editor.formatOnSave` permanece desactivado porque ESLint aplica el cambio como una acción de código, no como formateo.

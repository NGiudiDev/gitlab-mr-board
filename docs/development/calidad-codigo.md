# Calidad de código

## Orden automático de imports

La raíz configura ESLint con `eslint-plugin-simple-import-sort` para ordenar imports y exports en el backend TypeScript, el frontend React y los archivos de configuración JavaScript. Esta responsabilidad no depende de un formateador.

Las dependencias se instalan en la raíz y sus versiones exactas viven en `package.json` y `package-lock.json`. Para restaurarlas se usa `npm ci`.

El orden de grupos definido en `eslint.config.mjs` es:

1. Módulos estándar de Node.js con el protocolo `node:`.
2. Dependencias externas, incluidas las que tienen scope.
3. Módulos internos identificados con el alias `@/`.
4. Imports relativos, tanto del directorio padre como del actual.
5. Hojas de estilo CSS, Less, SCSS y Sass.

ESLint agrega una línea en blanco entre grupos y ordena alfabéticamente los módulos dentro de cada uno. Los imports de tipos siguen el grupo definido por el origen del módulo; no forman un bloque separado.

El resultado esperado sigue esta estructura:

```ts
import path from 'node:path'

import express from 'express'
import { describe, expect, it } from 'vitest'

import config from '@/config.js'

import type { MergeRequest } from '../types.js'
import { buildResponse } from './response.js'

import './styles.css'
```

El ejemplo es ilustrativo: un archivo incluye únicamente los grupos que necesita. No se agregan bloques vacíos ni imports artificiales para completar el orden.

Los imports con efectos secundarios se mantienen en el grupo correspondiente a su origen. Las hojas de estilo siempre quedan en el último grupo. La regla reconoce `@/` para ordenar, pero no configura su resolución: antes de usar ese alias hay que declararlo en las herramientas de compilación del paquete correspondiente.

## Comandos

| Comando | Uso |
|---|---|
| `npm run lint` | Valida el orden sin modificar archivos |
| `npm run lint:fix` | Ordena imports y exports automáticamente |

## VS Code

El repositorio recomienda la extensión oficial ESLint mediante `.vscode/extensions.json`. `.vscode/settings.json` ejecuta `source.fixAll.eslint` en cada guardado y desactiva `source.organizeImports` para que el organizador nativo no compita con el orden de grupos del proyecto.

`editor.formatOnSave` permanece desactivado porque ESLint aplica el cambio como una acción de código, no como formateo. Si más adelante se incorpora un formateador, puede activarse sin trasladarle la responsabilidad de ordenar imports.

# ADR 0012: dejar TypeScript y escribir el backend en JavaScript

- Estado: aceptada
- Fecha: 2026-09-08

## Contexto

El backend era el único paquete con TypeScript: el frontend ya estaba en `.jsx` y los scripts de la raíz en `.js`. Eso dejaba el proyecto partido en dos lenguajes y le sumaba al backend una cadena de herramientas propia —`typescript`, `tsx`, `@types/express`, `@types/cors`, `@types/node`, dos `tsconfig.json`, un paso de compilación a `dist/` y los plugins de `@typescript-eslint` en la raíz— para unas ocho mil líneas.

Ese costo se pagaba en varios lugares a la vez: los imports relativos llevaban `.js` para una salida `NodeNext` que después había que compilar, el despliegue tenía un `npm run build` y un `start:prod` contra `dist/`, y la validación previa a entregar sumaba un `npm run typecheck` sobre dos configuraciones distintas.

## Decisión

Todo el proyecto pasa a ser **JavaScript con ES modules**, sin compilación.

- Los 61 archivos `.ts` del backend pasan a `.js`, con la misma organización por feature del [ADR 0010](0010-backend-por-features.md).
- Los `types.ts` de cada feature y el `test/types.ts` **se eliminan**: sólo declaraban interfaces. Los contratos siguen documentados en la [arquitectura del backend](../architecture/backend.md) y sostenidos por los test, no por el compilador.
- Se eliminan `tsconfig.json`, `tsconfig.test.json`, los scripts `build`, `start:prod` y `typecheck`, y las dependencias `typescript`, `tsx` y `@types/*`.
- `npm run dev` usa `node --watch` y `npm start`, `node src/index.js`. Node ejecuta `src/` tal cual, así que **el despliegue deja de tener paso de compilación**.
- En la raíz se quitan `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` y `eslint-plugin-import-x`: el orden de imports lo sigue haciendo `eslint-plugin-simple-import-sort` con el parser propio de ESLint.
- El orden de grupos de imports pierde el grupo de imports de tipos y **se renumera del 1 al 7**, según la [guía de calidad de código](../development/calidad-codigo.md).

## Alternativas consideradas

- **Conservar TypeScript**: es lo que da la verificación estática más fuerte y ya estaba andando. Se descarta porque el pedido es sacarlo.
- **Traducir las interfaces a `@typedef` de JSDoc**: conserva los contratos documentados y el autocompletado del editor sin compilar. Se descarta para no arrastrar la misma superficie de tipos con otra sintaxis; la documentación y los test quedan como fuente de verdad de los contratos.
- **Anotar con JSDoc y validar con `checkJs`**: mantiene la verificación sin archivos `.ts`, pero deja `typescript` como dependencia y un `typecheck` en la validación, que es justo lo que se quiere quitar.
- **Ejecutar los `.ts` con el `--experimental-strip-types` de Node**: saca el paso de compilación pero no TypeScript, y deja los tipos sin verificar por nadie: lo peor de los dos mundos.

## Consecuencias

- **Se pierde la verificación estática de tipos.** Los errores que antes aparecían en `tsc` ahora aparecen en los test o en ejecución. La red de contención pasan a ser los 325 test del backend y `npm run lint`, que reemplaza a `typecheck` en la checklist de entrega.
- **Un lenguaje y una cadena de herramientas menos**: el backend arranca con `node` y se despliega sin `build`. Se van 5 dependencias directas del backend y 3 de la raíz.
- **Los imports relativos siguen llevando la extensión `.js`**, pero ahora porque lo exige Node en ES modules, no por la salida del compilador. Los especificadores no cambiaron: la conversión fue renombrar el archivo.
- **El contrato de la API queda documentado, no declarado.** Al cambiar una respuesta hay que actualizar la [arquitectura del backend](../architecture/backend.md) y los [dominios](../domains/README.md) a mano; antes el tipo obligaba a tocar el código.
- **Las clases con propiedades de constructor se escriben completas**: `HttpError` y `RateLimiter` asignan sus campos en el cuerpo del constructor, porque la forma abreviada era sintaxis de TypeScript.

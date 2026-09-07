# ADR 0010: organizar el backend por features

- Estado: aceptada
- Fecha: 2026-09-07

## Contexto

El backend estaba organizado por capas técnicas: `routes/`, `services/` y `utils/`, con un único `types.ts` de más de cuatrocientas líneas. Cuando había una sola funcionalidad eso alcanzaba, pero el proyecto ya tiene tres —autenticación, configuración de GitLab y el tablero de merge requests— y la organización empezó a estorbar:

- Tocar una funcionalidad significaba abrir tres carpetas distintas y buscar el archivo correcto en cada una.
- El `types.ts` mezclaba contratos de las tres funcionalidades con los de la infraestructura de test, así que cualquier cambio lo tocaba y nada indicaba qué pertenecía a qué.
- No había forma de ver, de un vistazo, qué depende de qué: todo estaba a un import de distancia de todo.

El frontend ya resuelve esto con `features/<feature>/{components,hooks}/`, y el problema es el mismo.

## Decisión

Reorganizar `backend/src/` **por feature primero y por capa después**, con la misma idea que el frontend:

```text
src/
  app.ts, index.ts, config.ts     Composición, arranque y configuración
  features/
    auth/                          routes/ services/ utils/ types.ts
    gitlabSettings/                routes/ services/ utils/ types.ts
    mergeRequests/                 routes/ services/ utils/ types.ts
  shared/                          database.ts httpError.ts types.ts
  scripts/                         Herramientas de línea de comandos
```

- **La separación por capas se conserva dentro de cada feature.** Sigue valiendo que las rutas HTTP van en `routes/`, la lógica de negocio en `services/` y las utilidades en `utils/`; lo que cambia es que ahora esas carpetas cuelgan de la feature.
- **Cada feature declara sus propios tipos** en su `types.ts`. El archivo central desapareció.
- **`shared/` es sólo para lo que usan varias features**: el acceso a Postgres, sus tipos y el error HTTP. Lo que usa una sola feature vive dentro de ella, aunque parezca genérico —el limitador de concurrencia y el cifrador de secretos son ejemplos—.
- **No hay barrels.** `app.ts` importa cada router por su ruta completa, igual que `App.jsx` importa cada componente por la suya.
- Los contratos que sólo existen para los test se mudaron a `backend/test/types.ts`, fuera del código que se despliega.

## Alternativas consideradas

- **Dejar la organización por capas**: es la que venía funcionando y evita un movimiento grande de archivos. Se descartó porque el costo crece con cada feature nueva, y porque tener dos criterios distintos en los dos paquetes del mismo proyecto obliga a recordar cuál aplica en cada uno.
- **Feature con archivos planos**, sin `routes/` ni `services/`: menos carpetas, pero pierde la separación de capas que el proyecto sostiene desde el [ADR 0001](0001-backend-for-frontend.md) y que evita que la lógica de negocio termine dentro de un handler.
- **Un barrel `index.ts` por feature**: da una superficie pública explícita, pero agrega un archivo por feature, esconde de dónde sale cada cosa y no es lo que hace el frontend.

## Consecuencias

- Agregar una funcionalidad es crear una carpeta bajo `features/` y montar su router desde `app.ts`; ya no hay que repartir archivos entre tres carpetas.
- Las dependencias entre features quedan a la vista en los imports: `mergeRequests` depende de `gitlabSettings` para las credenciales, y `gitlabSettings` depende de `auth` para exigir sesión. Eso es información útil que antes estaba oculta.
- Los imports relativos se alargan —`../../../shared/httpError.js`— porque el árbol es más profundo. Es el precio de agrupar por feature; un alias `@/` lo acortaría, pero sumaría configuración a TypeScript, a Vitest y a ESLint.
- `AuthError` y `GitLabSettingsError` eran la misma clase escrita dos veces y se unificaron en `HttpError`, con un único `respondWithHttpError` para traducirlo a una respuesta.
- Los test acompañaron a su módulo, así que los del tablero pasaron de `app.test.ts` a `features/mergeRequests/routes/`. En `app.test.ts` queda sólo lo que es de la composición: el health check.

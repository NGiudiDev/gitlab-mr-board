# ADR 0001: Backend for Frontend

- Estado: Aceptada
- Fecha: 2026-07-10

## Contexto

El tablero necesita construir una sola vista a partir de varios proyectos y endpoints de GitLab: merge requests, aprobaciones, discusiones y pipelines. La API de GitLab no entrega directamente el modelo que consume la interfaz, por lo que hay que coordinar solicitudes, paginar, tolerar fallos parciales y aplicar reglas propias de clasificación y responsabilidad.

Hacer ese trabajo desde el navegador tendría tres problemas principales:

- expondría el access token de GitLab y permitiría extraerlo desde el cliente;
- acoplaría la interfaz a los contratos, la paginación y los límites de GitLab;
- repartiría las reglas de negocio entre el frontend y la fuente externa.

Se necesita una frontera que proteja las credenciales y publique un contrato diseñado específicamente para el tablero.

## Decisión

Incorporar un **Backend for Frontend (BFF)** en Node.js y Express entre el navegador y GitLab. Un BFF es un backend dedicado a las necesidades de una interfaz concreta: no replica la API externa ni actúa como un proxy transparente, sino que entrega el modelo que esa interfaz necesita.

El navegador consume exclusivamente la API del BFF y nunca consulta GitLab de forma directa. El BFF:

- autentica la solicitud y resuelve la cuenta y sus credenciales;
- consulta GitLab respetando paginación y límites de concurrencia;
- consolida y normaliza respuestas de varios endpoints y proyectos;
- aplica las reglas de negocio del tablero;
- traduce errores externos a respuestas propias;
- devuelve un contrato estable que no contiene el access token.

El frontend queda a cargo de la presentación: navegación, agrupación visual, orden, formato y filtros sobre campos que el backend ya calculó.

## Alternativas consideradas

- **Consumir GitLab desde el navegador:** reduce la cantidad de servicios, pero expone el token y acopla la interfaz a GitLab.
- **Usar un proxy transparente:** oculta el token, pero conserva las múltiples solicitudes desde el cliente y deja allí la normalización y las reglas de negocio.
- **Crear una API de propósito general:** permitiría atender distintos clientes, pero obliga a diseñar contratos que el proyecto no necesita. El BFF puede evolucionar junto con esta interfaz sin anticipar consumidores hipotéticos.

## Consecuencias

### Positivas

- El access token permanece del lado del servidor y nunca forma parte del contrato HTTP con el navegador.
- Las reglas de negocio, el acceso a GitLab y el control de concurrencia tienen una única fuente de verdad.
- El frontend recibe menos respuestas, conoce un solo contrato y no depende de los cambios internos de GitLab.
- La caché, la tolerancia a fallos y la observabilidad se pueden resolver en la frontera común.

### Negativas

- Hay que desplegar, configurar y operar un servicio adicional junto con el frontend.
- El BFF se convierte en un punto crítico: si no está disponible, el tablero tampoco puede consultar GitLab.
- Un cambio en la información que muestra la interfaz puede requerir modificar tanto el contrato del backend como su consumo en el frontend.
- El contrato está orientado a esta aplicación; otro cliente con necesidades diferentes podría requerir endpoints propios u otro BFF.

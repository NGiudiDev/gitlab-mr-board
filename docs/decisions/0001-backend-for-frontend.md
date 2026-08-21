# ADR 0001: usar un Backend for Frontend

- Estado: aceptada
- Fecha: preexistente al registro documental

## Contexto

El tablero combina respuestas de GitLab y utiliza un token privado. Consultar desde el navegador expondría la credencial y trasladaría reglas al cliente.

## Decisión

Usar Express como BFF. Vue consume una respuesta consolidada; el backend autentica, limita concurrencia, normaliza y clasifica.

## Consecuencias

El token no llega al navegador y la UI recibe un modelo propio, a costa de desplegar y operar backend y frontend.

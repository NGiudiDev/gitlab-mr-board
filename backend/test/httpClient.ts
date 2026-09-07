// 1. Módulos estándar de Node.js.
import http from 'node:http';

// 4. Imports exclusivos de tipos de TypeScript.
import type { HttpTestOptions, HttpTestResponse } from './types.js';
import type { Express } from 'express';
import type { AddressInfo } from 'node:net';

/**
 * Ejecuta una petición real contra la app en memoria usando `node:http`.
 * Se evita `fetch` a propósito: los test lo reemplazan para simular GitLab.
 *
 * @param app Aplicación Express a levantar en un puerto efímero.
 * @param path Ruta a consultar, con su query string si corresponde.
 * @param options Método, cuerpo JSON y cabeceras extra —por ejemplo la cookie
 * de sesión— de la petición.
 * @returns Estado, cuerpo y cabeceras de la respuesta.
 */
function requestApp(
  app: Express,
  path: string,
  options: HttpTestOptions = {},
): Promise<HttpTestResponse> {
  const { method = 'GET', body, headers = {} } = options;
  const payload = body === undefined ? null : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;

      const request = http.request({
        host: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          ...(payload ? { 'content-type': 'application/json' } : {}),
          ...headers,
        },
      }, (response) => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => { responseBody += chunk; });
        response.on('end', () => {
          server.close(() => resolve({
            status: response.statusCode ?? 0,
            body: responseBody,
            headers: response.headers,
            json: <T>() => JSON.parse(responseBody) as T,
          }));
        });
      });

      request.on('error', (error) => {
        server.close(() => reject(error));
      });

      if (payload) request.write(payload);
      request.end();
    });
  });
}

/**
 * Extrae el valor de una cookie de las cabeceras `Set-Cookie`.
 *
 * @param response Respuesta devuelta por `requestApp`.
 * @param name Nombre de la cookie buscada.
 * @returns La cookie con formato `nombre=valor`, o `null` si no está.
 */
function readSetCookie(response: HttpTestResponse, name: string): string | null {
  const cookies = response.headers['set-cookie'] ?? [];
  const cookie = cookies.find((candidate) => candidate.startsWith(`${name}=`));

  return cookie ? (cookie.split(';')[0] ?? null) : null;
}

export { readSetCookie, requestApp };

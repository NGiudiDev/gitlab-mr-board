import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';

interface HttpTestResponse {
  status: number;
  body: string;
  json: <T>() => T;
}

/**
 * Ejecuta una petición real contra la app en memoria usando `node:http`.
 * Se evita `fetch` a propósito: las pruebas lo reemplazan para simular GitLab.
 */
function requestApp(app: Express, path: string): Promise<HttpTestResponse> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;

      const request = http.get({ host: '127.0.0.1', port, path }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => { body += chunk; });
        response.on('end', () => {
          server.close(() => resolve({
            status: response.statusCode ?? 0,
            body,
            json: <T>() => JSON.parse(body) as T,
          }));
        });
      });

      request.on('error', (error) => {
        server.close(() => reject(error));
      });
    });
  });
}

export { requestApp };
export type { HttpTestResponse };

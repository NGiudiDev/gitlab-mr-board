// 2. Dependencias externas.
import { describe, expect, it, vi } from 'vitest';

// 4. Módulos de constantes.
import { TEST_TOKEN } from '../test/constants.js';

// 6. Imports relativos restantes.
import { createAuthenticatedApp } from '../test/auth.js';
import { requestApp } from '../test/httpClient.js';
import handleVercelRequest, { createApp, createVercelHandler } from './app.js';

describe('GET /health', () => {
  it('informa el estado del proceso', async () => {
    const response = await requestApp(createApp(), '/health');

    expect(response.status).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('no exige sesión, para que el monitoreo externo siga funcionando', async () => {
    const { app } = await createAuthenticatedApp();

    const response = await requestApp(app, '/health');

    expect(response.status).toBe(200);
  });

  it('no expone el token de GitLab', async () => {
    const response = await requestApp(createApp(), '/health');

    expect(response.body).not.toContain(TEST_TOKEN);
  });
});

describe('entrada de Vercel', () => {
  it('expone un handler por omisión', () => {
    expect(handleVercelRequest).toBeTypeOf('function');
  });

  it('delega la solicitud a Express después de preparar la aplicación', async () => {
    const request = {};
    const response = {};
    const app = vi.fn(() => 'respuesta');
    const handler = createVercelHandler(async () => app);

    const result = await handler(request, response);

    expect(result).toBe('respuesta');
    expect(app).toHaveBeenCalledWith(request, response);
  });

  it('responde 503 si no puede preparar la aplicación', async () => {
    const error = new Error('Neon no disponible');
    const response = {
      end: vi.fn(),
      setHeader: vi.fn(),
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = createVercelHandler(async () => {
      throw error;
    });

    await handler({}, response);

    expect(response.statusCode).toBe(503);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    expect(response.end).toHaveBeenCalledWith(JSON.stringify({
      error: 'El backend no pudo conectarse con la base de datos.',
    }));
    expect(consoleError).toHaveBeenCalledWith(
      'No se pudo preparar el backend para atender la solicitud:',
      error,
    );

    consoleError.mockRestore();
  });
});

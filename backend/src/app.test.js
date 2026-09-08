// 2. Dependencias externas.
import { describe, expect, it } from 'vitest';

// 4. Módulos de constantes.
import { TEST_TOKEN } from '../test/constants.js';

// 6. Imports relativos restantes.
import { createAuthenticatedApp } from '../test/auth.js';
import { requestApp } from '../test/httpClient.js';
import { createApp } from './app.js';

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

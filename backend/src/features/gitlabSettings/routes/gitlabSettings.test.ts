// 2. Dependencias externas.
import { beforeEach, describe, expect, it } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedTestApp, HttpTestOptions } from '../../../../test/types.js';
import type { GitLabSettingsSummary } from '../types.js';

// 5. Módulos de constantes.
import { TEST_GITLAB_USERNAME, TEST_PROJECT_IDS, TEST_TOKEN } from '../../../../test/constants.js';

// 7. Imports relativos restantes.
import { createAuthenticatedApp } from '../../../../test/auth.js';
import { requestApp } from '../../../../test/httpClient.js';

const ENDPOINT = '/api/gitlab-settings';
const OTHER_TOKEN = 'glpat-otro-token-de-prueba';
const OTHER_USERNAME = 'otro-nickname';

let session: AuthenticatedTestApp;

/** Llama al endpoint reenviando la cookie de la sesión abierta. */
function request(options: HttpTestOptions = {}) {
  return requestApp(session.app, ENDPOINT, {
    ...options,
    headers: { cookie: session.cookie, ...options.headers },
  });
}

beforeEach(async () => {
  session = await createAuthenticatedApp();
});

describe('GET /api/gitlab-settings', () => {
  it('rechaza con 401 la petición sin sesión', async () => {
    const response = await requestApp(session.app, ENDPOINT);

    expect(response.status).toBe(401);
  });

  it('devuelve la configuración guardada sin el access token', async () => {
    const response = await request();
    const { settings } = response.json<{ settings: GitLabSettingsSummary }>();

    expect(response.status).toBe(200);
    expect(settings.projectIds).toEqual(TEST_PROJECT_IDS);
    expect(settings.tokenHint).toBe(TEST_TOKEN.slice(-4));
    expect(settings.gitlabUsername).toBe(TEST_GITLAB_USERNAME);
    expect(response.body).not.toContain(TEST_TOKEN);
  });

  it('devuelve null si la persona todavía no configuró nada', async () => {
    await session.gitlabSettingsService.remove(session.user.id);

    const response = await request();

    expect(response.json<{ settings: null }>().settings).toBeNull();
  });
});

describe('PUT /api/gitlab-settings', () => {
  it('rechaza con 401 la petición sin sesión', async () => {
    const response = await requestApp(session.app, ENDPOINT, {
      method: 'PUT',
      body: { gitlabUsername: OTHER_USERNAME, projectIds: '303', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(401);
  });

  it('guarda los proyectos y el token de la persona', async () => {
    const response = await request({
      method: 'PUT',
      body: { gitlabUsername: OTHER_USERNAME, projectIds: '303, 404', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(200);
    expect(response.json<{ settings: GitLabSettingsSummary }>().settings.projectIds)
      .toEqual(['303', '404']);
    expect(await session.gitlabSettingsService.getCredentials(session.user.id))
      .toMatchObject({ accessToken: OTHER_TOKEN, projectIds: ['303', '404'] });
  });

  it('nunca devuelve el access token recibido', async () => {
    const response = await request({
      method: 'PUT',
      body: { gitlabUsername: OTHER_USERNAME, projectIds: '303', accessToken: OTHER_TOKEN },
    });

    expect(response.body).not.toContain(OTHER_TOKEN);
  });

  it('conserva el token guardado cuando no se envía uno nuevo', async () => {
    await request({ method: 'PUT', body: { gitlabUsername: OTHER_USERNAME, projectIds: '303' } });

    expect(await session.gitlabSettingsService.getCredentials(session.user.id))
      .toMatchObject({ accessToken: TEST_TOKEN, projectIds: ['303'] });
  });

  it('responde 400 con un ID de proyecto inválido', async () => {
    const response = await request({
      method: 'PUT',
      body: { gitlabUsername: OTHER_USERNAME, projectIds: 'grupo/proyecto', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(400);
    expect(response.json<{ error: string }>().error).toMatch(/sólo números/);
  });

  it('responde 400 sin el nickname de GitLab', async () => {
    const response = await request({
      method: 'PUT',
      body: { projectIds: '303', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(400);
    expect(response.json<{ error: string }>().error).toMatch(/nickname de GitLab/);
  });

  it('responde 400 sin proyectos', async () => {
    const response = await request({ method: 'PUT', body: { accessToken: OTHER_TOKEN } });

    expect(response.status).toBe(400);
  });

  it('responde 400 con un token demasiado corto', async () => {
    const response = await request({
      method: 'PUT',
      body: { gitlabUsername: OTHER_USERNAME, projectIds: '303', accessToken: 'corto' },
    });

    expect(response.status).toBe(400);
  });

  it('exige el token en la primera configuración', async () => {
    await session.gitlabSettingsService.remove(session.user.id);

    const response = await request({ method: 'PUT', body: { gitlabUsername: OTHER_USERNAME, projectIds: '303' } });

    expect(response.status).toBe(400);
    expect(response.json<{ error: string }>().error).toMatch(/access token/);
  });

  it('sólo modifica la configuración de quien tiene la sesión abierta', async () => {
    const other = await session.authService.createUser({
      username: 'bruno',
      password: 'contrasena-de-prueba',
    });

    await request({ method: 'PUT', body: { gitlabUsername: OTHER_USERNAME, projectIds: '303', accessToken: OTHER_TOKEN } });

    expect(await session.gitlabSettingsService.getSummary(other.id)).toBeNull();
  });
});

describe('DELETE /api/gitlab-settings', () => {
  it('rechaza con 401 la petición sin sesión', async () => {
    const response = await requestApp(session.app, ENDPOINT, { method: 'DELETE' });

    expect(response.status).toBe(401);
  });

  it('borra la configuración de la persona', async () => {
    const response = await request({ method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(await session.gitlabSettingsService.getSummary(session.user.id)).toBeNull();
  });
});

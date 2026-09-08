// 2. Dependencias externas.
import { beforeEach, describe, expect, it } from 'vitest';

// 4. Módulos de constantes.
import { TEST_PROJECT_IDS, TEST_TOKEN } from '../../../../test/constants.js';

// 6. Imports relativos restantes.
import { createAuthenticatedApp } from '../../../../test/auth.js';
import { requestApp } from '../../../../test/httpClient.js';

const ENDPOINT = '/api/gitlab-settings';
const OTHER_TOKEN = 'glpat-otro-token-de-prueba';

let session;

/** Llama al endpoint reenviando la cookie de la sesión abierta. */
function request(options = {}) {
  return requestApp(session.app, ENDPOINT, {
    ...options,
    headers: { cookie: session.cookie, ...options.headers },
  });
}

/** Abre la sesión con el rol indicado; la configuración la carga un admin. */
async function openSession(role = 'admin') {
  session = await createAuthenticatedApp({}, role);
}

beforeEach(async () => {
  await openSession();
});

describe('GET /api/gitlab-settings', () => {
  it('rechaza con 401 la petición sin sesión', async () => {
    const response = await requestApp(session.app, ENDPOINT);

    expect(response.status).toBe(401);
  });

  it('devuelve la configuración de la cuenta sin el access token', async () => {
    const response = await request();
    const { settings } = response.json();

    expect(response.status).toBe(200);
    expect(settings.projectIds).toEqual(TEST_PROJECT_IDS);
    expect(settings.tokenHint).toBe(TEST_TOKEN.slice(-4));
    expect(response.body).not.toContain(TEST_TOKEN);
  });

  it('la lee también quien no administra: necesita saber si el tablero ya tiene datos', async () => {
    await openSession('user');

    const response = await request();

    expect(response.status).toBe(200);
    expect(response.json().settings.projectIds)
      .toEqual(TEST_PROJECT_IDS);
  });

  it('devuelve null si en la cuenta todavía no se configuró nada', async () => {
    await session.gitlabSettingsService.remove(session.account.id);

    const response = await request();

    expect(response.json().settings).toBeNull();
  });
});

describe('PUT /api/gitlab-settings', () => {
  it('rechaza con 401 la petición sin sesión', async () => {
    const response = await requestApp(session.app, ENDPOINT, {
      method: 'PUT',
      body: { projectIds: '303', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(401);
  });

  it('rechaza con 403 a quien no administra la cuenta', async () => {
    await openSession('user');

    const response = await request({
      method: 'PUT',
      body: { projectIds: '303', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(403);
    expect(await session.gitlabSettingsService.getCredentials(session.account.id))
      .toMatchObject({ projectIds: TEST_PROJECT_IDS });
  });

  it('guarda los proyectos y el token de la cuenta', async () => {
    const response = await request({
      method: 'PUT',
      body: { projectIds: '303, 404', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(200);
    expect(response.json().settings.projectIds)
      .toEqual(['303', '404']);
    expect(await session.gitlabSettingsService.getCredentials(session.account.id))
      .toMatchObject({ accessToken: OTHER_TOKEN, projectIds: ['303', '404'] });
  });

  it('nunca devuelve el access token recibido', async () => {
    const response = await request({
      method: 'PUT',
      body: { projectIds: '303', accessToken: OTHER_TOKEN },
    });

    expect(response.body).not.toContain(OTHER_TOKEN);
  });

  it('conserva el token guardado cuando no se envía uno nuevo', async () => {
    await request({ method: 'PUT', body: { projectIds: '303' } });

    expect(await session.gitlabSettingsService.getCredentials(session.account.id))
      .toMatchObject({ accessToken: TEST_TOKEN, projectIds: ['303'] });
  });

  it('responde 400 con un ID de proyecto inválido', async () => {
    const response = await request({
      method: 'PUT',
      body: { projectIds: 'grupo/proyecto', accessToken: OTHER_TOKEN },
    });

    expect(response.status).toBe(400);
    expect(response.json().error).toMatch(/sólo números/);
  });

  it('responde 400 sin proyectos', async () => {
    const response = await request({ method: 'PUT', body: { accessToken: OTHER_TOKEN } });

    expect(response.status).toBe(400);
  });

  it('responde 400 con un token demasiado corto', async () => {
    const response = await request({
      method: 'PUT',
      body: { projectIds: '303', accessToken: 'corto' },
    });

    expect(response.status).toBe(400);
  });

  it('exige el token en la primera configuración', async () => {
    await session.gitlabSettingsService.remove(session.account.id);

    const response = await request({ method: 'PUT', body: { projectIds: '303' } });

    expect(response.status).toBe(400);
    expect(response.json().error).toMatch(/access token/);
  });

  it('sólo modifica la configuración de la cuenta de la sesión', async () => {
    const otherAccount = await session.accountService.create('Otro equipo');

    await request({ method: 'PUT', body: { projectIds: '303', accessToken: OTHER_TOKEN } });

    expect(await session.gitlabSettingsService.getSummary(otherAccount.id)).toBeNull();
  });
});

describe('DELETE /api/gitlab-settings', () => {
  it('rechaza con 401 la petición sin sesión', async () => {
    const response = await requestApp(session.app, ENDPOINT, { method: 'DELETE' });

    expect(response.status).toBe(401);
  });

  it('rechaza con 403 a quien no administra la cuenta', async () => {
    await openSession('user');

    const response = await request({ method: 'DELETE' });

    expect(response.status).toBe(403);
    expect(await session.gitlabSettingsService.getSummary(session.account.id)).not.toBeNull();
  });

  it('borra la configuración de la cuenta', async () => {
    const response = await request({ method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(await session.gitlabSettingsService.getSummary(session.account.id)).toBeNull();
  });
});

// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpTestResponse } from '../../../../test/types.js';
// 4. Imports exclusivos de tipos de TypeScript.
import type { CreateAppOptions } from '../../../app.js';
import type { MergeRequestResponse } from '../types.js';

// 5. Módulos de constantes.
import { TEST_GITLAB_USERNAME, TEST_PROJECT_IDS, TEST_TOKEN } from '../../../../test/constants.js';

// 7. Imports relativos restantes.
import { createAuthenticatedApp } from '../../../../test/auth.js';
import { buildMergeRequest, createGitLabStub } from '../../../../test/fixtures/gitlab.js';
import { requestApp } from '../../../../test/httpClient.js';

/**
 * Levanta la app con sesión iniciada y devuelve un `GET` que ya reenvía la
 * cookie, para no repetirla en cada test del tablero.
 */
async function createBoardClient(options: CreateAppOptions = {}) {
  const { app, cookie, gitlabSettingsService, user } = await createAuthenticatedApp(options);

  return {
    app,
    cookie,
    gitlabSettingsService,
    user,
    get: (path: string): Promise<HttpTestResponse> => requestApp(app, path, { headers: { cookie } }),
  };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/pull-requests', () => {
  it('devuelve los merge requests consolidados desde GitLab', async () => {
    const stub = createGitLabStub({
      projects: { 101: 'equipo/tablero', 202: 'equipo/api' },
      mergeRequestPages: {
        101: [[buildMergeRequest({ iid: 7, labels: ['qa_approved'] })]],
        202: [[]],
      },
      approvals: { '101-7': { approved_by: [{ user: { username: 'ana' } }, { user: { username: 'lider' } }] } },
      discussions: { '101-7': [[]] },
      pipelines: { '101-7': [{ status: 'success', web_url: 'https://gitlab.example.com/pipe/1' }] },
    });
    vi.stubGlobal('fetch', stub.fetch);
    const { get } = await createBoardClient();

    const response = await get('/api/pull-requests');
    const payload = response.json<MergeRequestResponse>();

    expect(response.status).toBe(200);
    expect(payload.meta.totalMRs).toBe(1);
    expect(payload.mergeRequests[0]?.mergeability).toBe('ready_to_merge');
    expect(response.body).not.toContain(TEST_TOKEN);
  });

  it('informa el nickname de quien mira, para armar la vista personal', async () => {
    const stub = createGitLabStub({
      projects: { 101: 'equipo/tablero', 202: 'equipo/api' },
      mergeRequestPages: { 101: [[]], 202: [[]] },
    });
    vi.stubGlobal('fetch', stub.fetch);
    const { get } = await createBoardClient();

    const response = await get('/api/pull-requests');

    expect(response.json<MergeRequestResponse>().meta.viewerUsername)
      .toBe(TEST_GITLAB_USERNAME);
  });

  it('rechaza con 401 la petición sin sesión', async () => {
    const { app } = await createBoardClient({
      fetchMergeRequests: async () => { throw new Error('No debería consultarse GitLab.'); },
    });

    const response = await requestApp(app, '/api/pull-requests');

    expect(response.status).toBe(401);
    expect(response.json<{ error: string }>().error).toBe('Iniciá sesión para ver el tablero.');
  });

  it('rechaza con 401 una cookie de sesión inventada', async () => {
    const { app } = await createBoardClient();

    const response = await requestApp(app, '/api/pull-requests', {
      headers: { cookie: 'mr_board_session=token-que-no-existe' },
    });

    expect(response.status).toBe(401);
  });

  it('responde 409 si la persona todavía no configuró GitLab', async () => {
    const { get, gitlabSettingsService, user } = await createBoardClient({
      fetchMergeRequests: async () => { throw new Error('No debería consultarse GitLab.'); },
    });
    gitlabSettingsService.remove(user.id);

    const response = await get('/api/pull-requests');

    expect(response.status).toBe(409);
    expect(response.json<{ code: string }>().code).toBe('gitlab_settings_missing');
  });

  it('consulta GitLab con el token que guardó la persona', async () => {
    const stub = createGitLabStub({
      projects: { 101: 'equipo/tablero', 202: 'equipo/api' },
      mergeRequestPages: { 101: [[]], 202: [[]] },
    });
    vi.stubGlobal('fetch', stub.fetch);
    const { get } = await createBoardClient();

    await get('/api/pull-requests');

    expect(stub.sentHeaders.every((headers) => headers['PRIVATE-TOKEN'] === TEST_TOKEN)).toBe(true);
  });

  it('traduce un fallo de GitLab a HTTP 502 con mensaje en español', async () => {
    const { get } = await createBoardClient({
      fetchMergeRequests: async () => { throw new Error('Token inválido o sin permisos.'); },
    });

    const response = await get('/api/pull-requests');

    expect(response.status).toBe(502);
    expect(response.json<{ error: string; detail: string }>()).toEqual({
      error: 'No se pudieron obtener los merge requests de GitLab.',
      detail: 'Token inválido o sin permisos.',
    });
  });

  it('no filtra el token en el detalle del error ni en los logs', async () => {
    vi.stubGlobal('fetch', async () => new Response('no autorizado', { status: 401 }));
    const { get } = await createBoardClient();

    const response = await get('/api/pull-requests');
    const loggedText = vi.mocked(console.error).mock.calls.flat().map(String).join(' ');

    expect(response.status).toBe(200);
    expect(response.body).not.toContain(TEST_TOKEN);
    expect(loggedText).not.toContain(TEST_TOKEN);
  });
});

describe('caché de GET /api/pull-requests', () => {
  function buildPayload(totalMRs: number): MergeRequestResponse {
    return {
      mergeRequests: [],
      meta: {
        fetchedAt: '2026-08-28T12:00:00.000Z',
        projectCount: TEST_PROJECT_IDS.length,
        totalMRs,
        allProjects: [],
        people: [],
        viewerUsername: null,
      },
    };
  }

  /** App con reloj y fuente de datos controlados para observar el TTL. */
  async function createCachedApp() {
    let currentTime = 0;
    let calls = 0;
    const { get } = await createBoardClient({
      now: () => currentTime,
      fetchMergeRequests: async () => {
        calls++;
        return buildPayload(calls);
      },
    });

    return {
      get,
      advance: (milliseconds: number) => { currentTime += milliseconds; },
      getCalls: () => calls,
    };
  }

  it('reutiliza la caché dentro del TTL', async () => {
    const { get, advance, getCalls } = await createCachedApp();

    const first = await get('/api/pull-requests');
    advance(59_000);
    const second = await get('/api/pull-requests');

    expect(getCalls()).toBe(1);
    expect(second.json<MergeRequestResponse>().meta.totalMRs)
      .toBe(first.json<MergeRequestResponse>().meta.totalMRs);
  });

  it('vuelve a consultar GitLab cuando vence el TTL', async () => {
    const { get, advance, getCalls } = await createCachedApp();

    await get('/api/pull-requests');
    advance(60_000);
    const second = await get('/api/pull-requests');

    expect(getCalls()).toBe(2);
    expect(second.json<MergeRequestResponse>().meta.totalMRs).toBe(2);
  });

  it('omite la caché con ?force=true', async () => {
    const { get, getCalls } = await createCachedApp();

    await get('/api/pull-requests');
    const forced = await get('/api/pull-requests?force=true');

    expect(getCalls()).toBe(2);
    expect(forced.json<MergeRequestResponse>().meta.totalMRs).toBe(2);
  });

  it('ignora un valor de force distinto de true', async () => {
    const { get, getCalls } = await createCachedApp();

    await get('/api/pull-requests');
    await get('/api/pull-requests?force=1');

    expect(getCalls()).toBe(1);
  });

  it('descarta la caché cuando la persona cambia su configuración', async () => {
    let calls = 0;
    const { get, gitlabSettingsService, user } = await createBoardClient({
      now: () => 0,
      fetchMergeRequests: async () => {
        calls++;
        return buildPayload(calls);
      },
    });

    await get('/api/pull-requests');
    gitlabSettingsService.save(user.id, { projectIds: ['303'], gitlabUsername: 'otro' });
    const afterChange = await get('/api/pull-requests');

    expect(calls).toBe(2);
    expect(afterChange.json<MergeRequestResponse>().meta.totalMRs).toBe(2);
  });

  it('no guarda en caché una respuesta fallida', async () => {
    let calls = 0;
    const { get } = await createBoardClient({
      now: () => 0,
      fetchMergeRequests: async () => {
        calls++;
        if (calls === 1) throw new Error('GitLab no respondió.');
        return buildPayload(calls);
      },
    });

    const failed = await get('/api/pull-requests');
    const retried = await get('/api/pull-requests');

    expect(failed.status).toBe(502);
    expect(retried.status).toBe(200);
    expect(calls).toBe(2);
  });
});

// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 4. Módulos de constantes.
import { TEST_GITLAB_USERNAME, TEST_PASSWORD, TEST_PROJECT_IDS, TEST_TOKEN } from '../../../../test/constants.js';

// 6. Imports relativos restantes.
import { createAuthenticatedApp } from '../../../../test/auth.js';
import { buildMergeRequest, createGitLabStub } from '../../../../test/fixtures/gitlab.js';
import { requestApp } from '../../../../test/httpClient.js';
import { SESSION_COOKIE_NAME } from '../../auth/routes/auth.js';

/**
 * Levanta la app con sesión iniciada y devuelve un `GET` que ya reenvía la
 * cookie, para no repetirla en cada test del tablero.
 */
async function createBoardClient(options = {}) {
  const { account, accountService, app, authService, cookie, gitlabSettingsService, user } = await createAuthenticatedApp(options);

  return {
    account,
    accountService,
    app,
    authService,
    cookie,
    gitlabSettingsService,
    user,
    get: (path, sessionCookie = cookie) =>
      requestApp(app, path, { headers: { cookie: sessionCookie } }),
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
    const payload = response.json();

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

    expect(response.json().meta.viewerUsername)
      .toBe(TEST_GITLAB_USERNAME);
  });

  it('rechaza con 401 la petición sin sesión', async () => {
    const { app } = await createBoardClient({
      fetchMergeRequests: async () => { throw new Error('No debería consultarse GitLab.'); },
    });

    const response = await requestApp(app, '/api/pull-requests');

    expect(response.status).toBe(401);
    expect(response.json().error).toBe('Iniciá sesión para ver el tablero.');
  });

  it('rechaza con 401 una cookie de sesión inventada', async () => {
    const { app } = await createBoardClient();

    const response = await requestApp(app, '/api/pull-requests', {
      headers: { cookie: 'mr_board_session=token-que-no-existe' },
    });

    expect(response.status).toBe(401);
  });

  it('responde 409 si en la cuenta todavía no se configuró GitLab', async () => {
    const { account, get, gitlabSettingsService } = await createBoardClient({
      fetchMergeRequests: async () => { throw new Error('No debería consultarse GitLab.'); },
    });
    await gitlabSettingsService.remove(account.id);

    const response = await get('/api/pull-requests');

    expect(response.status).toBe(409);
    expect(response.json().code).toBe('gitlab_settings_missing');
  });

  it('consulta GitLab con el token que guardó la cuenta', async () => {
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
    expect(response.json()).toEqual({
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
  function buildPayload(totalMRs) {
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
      advance: (milliseconds) => { currentTime += milliseconds; },
      getCalls: () => calls,
    };
  }

  it('reutiliza la caché dentro del TTL', async () => {
    const { get, advance, getCalls } = await createCachedApp();

    const first = await get('/api/pull-requests');
    advance(59_000);
    const second = await get('/api/pull-requests');

    expect(getCalls()).toBe(1);
    expect(second.json().meta.totalMRs)
      .toBe(first.json().meta.totalMRs);
  });

  it('vuelve a consultar GitLab cuando vence el TTL', async () => {
    const { get, advance, getCalls } = await createCachedApp();

    await get('/api/pull-requests');
    advance(60_000);
    const second = await get('/api/pull-requests');

    expect(getCalls()).toBe(2);
    expect(second.json().meta.totalMRs).toBe(2);
  });

  it('omite la caché con ?force=true', async () => {
    const { get, getCalls } = await createCachedApp();

    await get('/api/pull-requests');
    const forced = await get('/api/pull-requests?force=true');

    expect(getCalls()).toBe(2);
    expect(forced.json().meta.totalMRs).toBe(2);
  });

  it('ignora un valor de force distinto de true', async () => {
    const { get, getCalls } = await createCachedApp();

    await get('/api/pull-requests');
    await get('/api/pull-requests?force=1');

    expect(getCalls()).toBe(1);
  });

  it('descarta la caché cuando cambia la configuración de la cuenta', async () => {
    let calls = 0;
    const { account, get, gitlabSettingsService } = await createBoardClient({
      now: () => 0,
      fetchMergeRequests: async () => {
        calls++;
        return buildPayload(calls);
      },
    });

    await get('/api/pull-requests');
    await gitlabSettingsService.save(account.id, { projectIds: ['303'] });
    const afterChange = await get('/api/pull-requests');

    expect(calls).toBe(2);
    expect(afterChange.json().meta.totalMRs).toBe(2);
  });

  it('comparte la respuesta entre los miembros de la cuenta, con el nickname de cada uno', async () => {
    let calls = 0;
    const { account, authService, get } = await createBoardClient({
      now: () => 0,
      fetchMergeRequests: async () => {
        calls++;
        return buildPayload(calls);
      },
    });
    const other = await authService.createUser({
      accountId: account.id,
      username: 'bruno',
      password: TEST_PASSWORD,
    });
    await authService.changeGitlabUsername(other.id, 'bruno-gitlab');
    const { token } = await authService.login({ username: 'bruno', password: TEST_PASSWORD });

    const mine = await get('/api/pull-requests');
    const theirs = await get('/api/pull-requests', `${SESSION_COOKIE_NAME}=${token}`);

    // Una sola consulta a GitLab para las dos personas: el token es el mismo.
    expect(calls).toBe(1);
    expect(mine.json().meta.viewerUsername).toBe(TEST_GITLAB_USERNAME);
    expect(theirs.json().meta.viewerUsername).toBe('bruno-gitlab');
  });

  it('no comparte la caché entre cuentas distintas', async () => {
    let calls = 0;
    const { accountService, authService, get, gitlabSettingsService } = await createBoardClient({
      now: () => 0,
      fetchMergeRequests: async () => {
        calls++;
        return buildPayload(calls);
      },
    });
    const otherAccount = await accountService.create('Otro equipo');
    await authService.createUser({
      accountId: otherAccount.id,
      username: 'beto',
      password: TEST_PASSWORD,
    });
    await gitlabSettingsService.save(otherAccount.id, {
      projectIds: ['303'],
      accessToken: TEST_TOKEN,
    });
    const { token } = await authService.login({ username: 'beto', password: TEST_PASSWORD });

    await get('/api/pull-requests');
    await get('/api/pull-requests', `${SESSION_COOKIE_NAME}=${token}`);

    expect(calls).toBe(2);
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

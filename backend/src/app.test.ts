import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { TEST_PROJECT_IDS, TEST_TOKEN } from '../test/constants.js';
import { buildMergeRequest, createGitLabStub } from '../test/fixtures/gitlab.js';
import { requestApp } from '../test/httpClient.js';
import type { MergeRequestResponse } from './types.js';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /health', () => {
  it('informa el estado y la cantidad de proyectos monitoreados', async () => {
    const response = await requestApp(createApp(), '/health');

    expect(response.status).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', projects: TEST_PROJECT_IDS.length });
  });

  it('no expone el token de GitLab', async () => {
    const response = await requestApp(createApp(), '/health');

    expect(response.body).not.toContain(TEST_TOKEN);
  });
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

    const response = await requestApp(createApp(), '/api/pull-requests');
    const payload = response.json<MergeRequestResponse>();

    expect(response.status).toBe(200);
    expect(payload.meta.totalMRs).toBe(1);
    expect(payload.mergeRequests[0]?.mergeability).toBe('ready_to_merge');
    expect(response.body).not.toContain(TEST_TOKEN);
  });

  it('traduce un fallo de GitLab a HTTP 502 con mensaje en español', async () => {
    const app = createApp({
      fetchMergeRequests: async () => { throw new Error('Token inválido o sin permisos.'); },
    });

    const response = await requestApp(app, '/api/pull-requests');

    expect(response.status).toBe(502);
    expect(response.json<{ error: string; detail: string }>()).toEqual({
      error: 'No se pudieron obtener los merge requests de GitLab.',
      detail: 'Token inválido o sin permisos.',
    });
  });

  it('no filtra el token en el detalle del error ni en los logs', async () => {
    vi.stubGlobal('fetch', async () => new Response('no autorizado', { status: 401 }));
    const app = createApp();

    const response = await requestApp(app, '/api/pull-requests');
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
      },
    };
  }

  /** App con reloj y fuente de datos controlados para observar el TTL. */
  function createCachedApp() {
    let currentTime = 0;
    let calls = 0;
    const app = createApp({
      now: () => currentTime,
      fetchMergeRequests: async () => {
        calls++;
        return buildPayload(calls);
      },
    });

    return {
      app,
      advance: (milliseconds: number) => { currentTime += milliseconds; },
      getCalls: () => calls,
    };
  }

  it('reutiliza la caché dentro del TTL', async () => {
    const { app, advance, getCalls } = createCachedApp();

    const first = await requestApp(app, '/api/pull-requests');
    advance(59_000);
    const second = await requestApp(app, '/api/pull-requests');

    expect(getCalls()).toBe(1);
    expect(second.json<MergeRequestResponse>().meta.totalMRs)
      .toBe(first.json<MergeRequestResponse>().meta.totalMRs);
  });

  it('vuelve a consultar GitLab cuando vence el TTL', async () => {
    const { app, advance, getCalls } = createCachedApp();

    await requestApp(app, '/api/pull-requests');
    advance(60_000);
    const second = await requestApp(app, '/api/pull-requests');

    expect(getCalls()).toBe(2);
    expect(second.json<MergeRequestResponse>().meta.totalMRs).toBe(2);
  });

  it('omite la caché con ?force=true', async () => {
    const { app, getCalls } = createCachedApp();

    await requestApp(app, '/api/pull-requests');
    const forced = await requestApp(app, '/api/pull-requests?force=true');

    expect(getCalls()).toBe(2);
    expect(forced.json<MergeRequestResponse>().meta.totalMRs).toBe(2);
  });

  it('ignora un valor de force distinto de true', async () => {
    const { app, getCalls } = createCachedApp();

    await requestApp(app, '/api/pull-requests');
    await requestApp(app, '/api/pull-requests?force=1');

    expect(getCalls()).toBe(1);
  });

  it('no guarda en caché una respuesta fallida', async () => {
    let calls = 0;
    const app = createApp({
      now: () => 0,
      fetchMergeRequests: async () => {
        calls++;
        if (calls === 1) throw new Error('GitLab no respondió.');
        return buildPayload(calls);
      },
    });

    const failed = await requestApp(app, '/api/pull-requests');
    const retried = await requestApp(app, '/api/pull-requests');

    expect(failed.status).toBe(502);
    expect(retried.status).toBe(200);
    expect(calls).toBe(2);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { TEST_BASE_URL, TEST_TOKEN } from '../../test/constants.js';
import type { GitLabTestItem } from '../types.js';
import { buildUrl, fetchJson, fetchPaginated } from './gitlabApi.js';

function jsonResponse(body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildUrl', () => {
  it('arma la URL sobre la API v4 de la instancia configurada', () => {
    expect(buildUrl('/projects/101/merge_requests'))
      .toBe(`${TEST_BASE_URL}/api/v4/projects/101/merge_requests`);
  });

  it('agrega los parámetros de consulta recibidos', () => {
    const url = new URL(buildUrl('/projects/101/merge_requests', { state: 'opened', per_page: 100 }));

    expect(url.searchParams.get('state')).toBe('opened');
    expect(url.searchParams.get('per_page')).toBe('100');
  });

  it('omite los parámetros nulos o indefinidos', () => {
    const url = new URL(buildUrl('/projects/101', { scope: null, search: undefined, draft: false }));

    expect(url.searchParams.has('scope')).toBe(false);
    expect(url.searchParams.has('search')).toBe(false);
    expect(url.searchParams.get('draft')).toBe('false');
  });

  it('no duplica la barra final de la URL base', () => {
    expect(buildUrl('/projects')).not.toContain('//api/v4');
  });
});

describe('fetchJson', () => {
  it('envía el token en la cabecera PRIVATE-TOKEN', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    const { data } = await fetchJson<GitLabTestItem>('/projects/101');

    expect(data).toEqual({ id: 1 });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['PRIVATE-TOKEN']).toBe(TEST_TOKEN);
  });

  it('traduce un 401 a un mensaje sobre el alcance del token', async () => {
    vi.stubGlobal('fetch', async () => new Response('no autorizado', { status: 401 }));

    await expect(fetchJson('/projects/101')).rejects.toThrow(/read_api/);
  });

  it('traduce un 404 indicando el recurso solicitado', async () => {
    vi.stubGlobal('fetch', async () => new Response('no existe', { status: 404 }));

    await expect(fetchJson('/projects/999')).rejects.toThrow('Recurso no encontrado: /projects/999');
  });

  it('incluye el código y un extracto del cuerpo en otros errores', async () => {
    vi.stubGlobal('fetch', async () => new Response('detalle del fallo', { status: 500 }));

    await expect(fetchJson('/projects/101')).rejects.toThrow('Error de la API de GitLab 500: detalle del fallo');
  });

  it('no expone el token en el mensaje de error', async () => {
    vi.stubGlobal('fetch', async () => new Response('detalle', { status: 500 }));

    await expect(fetchJson('/projects/101')).rejects.not.toThrow(new RegExp(TEST_TOKEN));
  });
});

describe('fetchPaginated', () => {
  it('recorre las páginas hasta que no hay x-next-page', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (page === '1') return jsonResponse([{ id: 1 }], { 'x-next-page': '2' });
      return jsonResponse([{ id: 2 }]);
    });
    vi.stubGlobal('fetch', fetchMock);

    const items = await fetchPaginated<GitLabTestItem>('/projects/101/merge_requests');

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('pide 100 elementos por página', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await fetchPaginated('/projects/101/merge_requests');

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(new URL(url).searchParams.get('per_page')).toBe('100');
  });

  it('conserva los parámetros recibidos en cada página', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      return jsonResponse([], page === '1' ? { 'x-next-page': '2' } : {});
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchPaginated('/projects/101/merge_requests', { state: 'opened' });

    const urls = fetchMock.mock.calls.map(([url]) => new URL(url as string));
    expect(urls.every((url) => url.searchParams.get('state') === 'opened')).toBe(true);
  });

  it('corta en la página 10 aunque GitLab siga ofreciendo más', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = Number.parseInt(new URL(url).searchParams.get('page') ?? '1', 10);
      return jsonResponse([{ id: page }], { 'x-next-page': String(page + 1) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const items = await fetchPaginated<GitLabTestItem>('/projects/101/merge_requests');

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(items).toHaveLength(10);
  });

  it('propaga el error de una página intermedia', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (page === '1') return jsonResponse([{ id: 1 }], { 'x-next-page': '2' });
      return new Response('falla', { status: 500 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPaginated('/projects/101/merge_requests')).rejects.toThrow(/500/);
  });
});

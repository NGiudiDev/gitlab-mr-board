import config from '../config.js';
import type { QueryValue } from '../types.js';
import RateLimiter from '../utils/rateLimiter.js';

type QueryParams = Record<string, QueryValue>;

interface GitLabResponse<T> {
  data: T;
  headers: Headers;
}

const limiter = new RateLimiter(6);

function buildUrl(resourcePath: string, params: QueryParams = {}): string {
  const url = new URL(`${config.gitlabBaseUrl}/api/v4${resourcePath}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson<T>(resourcePath: string, params: QueryParams = {}): Promise<GitLabResponse<T>> {
  const url = buildUrl(resourcePath, params);
  const response = await fetch(url, {
    headers: { 'PRIVATE-TOKEN': config.gitlabToken },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const message = response.status === 401
      ? 'Token inválido o sin permisos (se requiere el alcance read_api).'
      : response.status === 404
        ? `Recurso no encontrado: ${resourcePath}`
        : `Error de la API de GitLab ${response.status}: ${body.slice(0, 200)}`;
    throw new Error(message);
  }

  return { data: await response.json() as T, headers: response.headers };
}

async function fetchPaginated<T>(resourcePath: string, params: QueryParams = {}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    const { data, headers } = await fetchJson<T[]>(resourcePath, { ...params, page, per_page: 100 });
    results.push(...data);

    const nextPage = headers.get('x-next-page');
    if (!nextPage) break;
    page = Number.parseInt(nextPage, 10);
  }

  return results;
}

function fetchWithLimit<T>(resourcePath: string, params: QueryParams = {}): Promise<GitLabResponse<T>> {
  return limiter.run(() => fetchJson<T>(resourcePath, params));
}

function fetchPaginatedWithLimit<T>(resourcePath: string, params: QueryParams = {}): Promise<T[]> {
  return limiter.run(() => fetchPaginated<T>(resourcePath, params));
}

export { fetchJson, fetchPaginated, fetchWithLimit, fetchPaginatedWithLimit };

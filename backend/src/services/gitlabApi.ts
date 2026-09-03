import config from '../config.js';
import type { GitLabResponse, QueryParams } from '../types.js';
import RateLimiter from '../utils/rateLimiter.js';

const GITLAB_API_PATH = '/api/v4';
const MAX_CONCURRENT_REQUESTS = 6;
const MAX_PAGES = 10;
const ITEMS_PER_PAGE = 100;
const ERROR_BODY_MAX_LENGTH = 200;

const requestLimiter = new RateLimiter(MAX_CONCURRENT_REQUESTS);

/** Agrega a la URL los parámetros definidos y omite valores nulos. */
function appendQueryParams(url: URL, params: QueryParams): void {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    url.searchParams.set(key, String(value));
  });
}

/** Construye una URL absoluta para un recurso de la API v4 de GitLab. */
function buildUrl(resourcePath: string, params: QueryParams = {}): string {
  const url = new URL(`${config.gitlabBaseUrl}${GITLAB_API_PATH}${resourcePath}`);
  appendQueryParams(url, params);

  return url.toString();
}

/** Traduce un error HTTP de GitLab a un mensaje seguro y diagnosticable. */
function buildGitLabErrorMessage(status: number, resourcePath: string, responseBody: string): string {
  if (status === 401) {
    return 'Token inválido o sin permisos (se requiere el alcance read_api).';
  }

  if (status === 404) {
    return `Recurso no encontrado: ${resourcePath}`;
  }

  return `Error de la API de GitLab ${status}: ${responseBody.slice(0, ERROR_BODY_MAX_LENGTH)}`;
}

/** Consulta un recurso JSON autenticado y conserva las cabeceras de respuesta. */
async function fetchJson<T>(resourcePath: string, params: QueryParams = {}): Promise<GitLabResponse<T>> {
  const url = buildUrl(resourcePath, params);
  const response = await fetch(url, {
    headers: { 'PRIVATE-TOKEN': config.gitlabToken },
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(buildGitLabErrorMessage(response.status, resourcePath, responseBody));
  }

  return { data: await response.json() as T, headers: response.headers };
}

/** Recorre la paginación de GitLab hasta terminar o alcanzar el límite seguro. */
async function fetchPaginated<T>(resourcePath: string, params: QueryParams = {}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const { data, headers } = await fetchJson<T[]>(resourcePath, {
      ...params,
      page,
      per_page: ITEMS_PER_PAGE,
    });
    results.push(...data);

    const nextPage = headers.get('x-next-page');
    if (!nextPage) break;
    page = Number.parseInt(nextPage, 10);
  }

  return results;
}

/** Ejecuta una consulta JSON respetando el límite global de concurrencia. */
function fetchWithLimit<T>(resourcePath: string, params: QueryParams = {}): Promise<GitLabResponse<T>> {
  return requestLimiter.run(() => fetchJson<T>(resourcePath, params));
}

/** Ejecuta una consulta paginada dentro de un único turno del limitador. */
function fetchPaginatedWithLimit<T>(resourcePath: string, params: QueryParams = {}): Promise<T[]> {
  return requestLimiter.run(() => fetchPaginated<T>(resourcePath, params));
}

export { buildUrl, fetchJson, fetchPaginated, fetchWithLimit, fetchPaginatedWithLimit };

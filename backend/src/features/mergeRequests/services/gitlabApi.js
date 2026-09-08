// 5. Utilidades.
import RateLimiter from '../utils/rateLimiter.js';

// 6. Imports relativos restantes.
import config from '../../../config.js';

const GITLAB_API_PATH = '/api/v4';
const MAX_CONCURRENT_REQUESTS = 6;
const MAX_PAGES = 10;
const ITEMS_PER_PAGE = 100;
const ERROR_BODY_MAX_LENGTH = 200;

// El limitador es del proceso, no de cada cliente: protege a la instancia de
// GitLab del total de consultas, sin importar en nombre de quién se hagan.
const requestLimiter = new RateLimiter(MAX_CONCURRENT_REQUESTS);

/** Agrega a la URL los parámetros definidos y omite valores nulos. */
function appendQueryParams(url, params) {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    url.searchParams.set(key, String(value));
  });
}

/** Construye una URL absoluta para un recurso de la API v4 de GitLab. */
function buildUrl(resourcePath, params = {}) {
  const url = new URL(`${config.gitlabBaseUrl}${GITLAB_API_PATH}${resourcePath}`);
  appendQueryParams(url, params);

  return url.toString();
}

/** Traduce un error HTTP de GitLab a un mensaje seguro y diagnosticable. */
function buildGitLabErrorMessage(status, resourcePath, responseBody) {
  if (status === 401) {
    return 'Token inválido o sin permisos (se requiere el alcance read_api).';
  }

  if (status === 404) {
    return `Recurso no encontrado: ${resourcePath}`;
  }

  return `Error de la API de GitLab ${status}: ${responseBody.slice(0, ERROR_BODY_MAX_LENGTH)}`;
}

/**
 * Arma el cliente de GitLab para un access token concreto.
 *
 * Cada persona configura su propio token, así que el cliente se construye por
 * consulta al tablero en lugar de vivir a nivel de módulo.
 *
 * @param accessToken PAT con alcance `read_api`.
 * @returns Cliente con las consultas ya autenticadas y limitadas.
 */
function createGitLabClient(accessToken) {
  /** Consulta un recurso JSON autenticado y conserva las cabeceras de respuesta. */
  async function fetchJson(resourcePath, params = {}) {
    const url = buildUrl(resourcePath, params);
    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': accessToken },
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '');
      throw new Error(buildGitLabErrorMessage(response.status, resourcePath, responseBody));
    }

    return { data: await response.json(), headers: response.headers };
  }

  /** Recorre la paginación de GitLab hasta terminar o alcanzar el límite seguro. */
  async function fetchPaginated(resourcePath, params = {}) {
    const results = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const { data, headers } = await fetchJson(resourcePath, {
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

  return {
    /** Ejecuta una consulta JSON respetando el límite global de concurrencia. */
    fetchWithLimit(resourcePath, params = {}) {
      return requestLimiter.run(() => fetchJson(resourcePath, params));
    },

    /** Ejecuta una consulta paginada dentro de un único turno del limitador. */
    fetchPaginatedWithLimit(resourcePath, params = {}) {
      return requestLimiter.run(() => fetchPaginated(resourcePath, params));
    },
  };
}

export { createGitLabClient };

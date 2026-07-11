const config = require('../config');
const RateLimiter = require('../utils/rateLimiter');

const limiter = new RateLimiter(6);

function buildUrl(path, params = {}) {
  const url = new URL(`${config.gitlabBaseUrl}/api/v4${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson(path, params = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    headers: { 'PRIVATE-TOKEN': config.gitlabToken },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const msg =
      res.status === 401
        ? 'Token inválido o sin permisos (scope read_api requerido).'
        : res.status === 404
          ? `Recurso no encontrado: ${path}`
          : `GitLab API error ${res.status}: ${body.slice(0, 200)}`;
    throw new Error(msg);
  }

  return { data: await res.json(), headers: res.headers };
}

async function fetchPaginated(path, params = {}) {
  const results = [];
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    const { data, headers } = await fetchJson(path, { ...params, page, per_page: 100 });
    results.push(...data);

    const nextPage = headers.get('x-next-page');
    if (!nextPage) break;
    page = parseInt(nextPage, 10);
  }

  return results;
}

async function fetchWithLimit(path, params = {}) {
  return limiter.run(() => fetchJson(path, params));
}

async function fetchPaginatedWithLimit(path, params = {}) {
  return limiter.run(() => fetchPaginated(path, params));
}

module.exports = { fetchJson, fetchPaginated, fetchWithLimit, fetchPaginatedWithLimit };

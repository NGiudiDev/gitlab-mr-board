const AVATAR = 'https://gitlab.example.com/uploads/avatar.png';

/** MR de GitLab con valores neutros; cada prueba sobrescribe lo que le importa. */
function buildMergeRequest(overrides = {}) {
  return {
    project_id: 101,
    iid: 1,
    title: 'Agregar filtro por autor',
    web_url: 'https://gitlab.example.com/equipo/tablero/-/merge_requests/1',
    author: { name: 'Ana Pérez', username: 'ana', avatar_url: AVATAR },
    references: { full: 'equipo/tablero!1' },
    source_branch: 'feature/filtro-autor',
    target_branch: 'main',
    labels: [],
    draft: false,
    work_in_progress: false,
    has_conflicts: false,
    reviewers: [],
    updated_at: '2026-08-20T10:00:00.000Z',
    created_at: '2026-08-19T10:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function errorResponse(status) {
  return new Response(`error simulado de GitLab (${status})`, { status });
}

function paginatedResponse(pages, requestedPage) {
  const pageIndex = Math.max(0, requestedPage - 1);
  const items = pages[pageIndex] ?? [];
  const hasNextPage = pageIndex + 1 < pages.length;
  return jsonResponse(items, hasNextPage ? { 'x-next-page': String(requestedPage + 1) } : {});
}

function resolveFixture(entry, notFoundStatus = 404) {
  if (entry === undefined) return errorResponse(notFoundStatus);
  if (typeof entry === 'number') return errorResponse(entry);
  return null;
}

/**
 * Reemplazo de `global.fetch` que responde la API de GitLab con fixtures
 * locales. No hay red, ni token real, ni dependencia de datos externos.
 */
function createGitLabStub(fixture = {}) {
  const requestedUrls = [];
  const sentHeaders = [];

  async function stubbedFetch(input, init = {}) {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    requestedUrls.push(rawUrl);
    sentHeaders.push({ ...(init.headers) });

    const url = new URL(rawUrl);
    const apiPath = url.pathname.replace('/api/v4', '');
    const page = Number.parseInt(url.searchParams.get('page') ?? '1', 10);

    const listMatch = /^\/projects\/([^/]+)\/merge_requests$/.exec(apiPath);
    if (listMatch) {
      const projectId = listMatch[1];
      const pages = fixture.mergeRequestPages?.[projectId];
      return resolveFixture(pages) ?? paginatedResponse(pages, page);
    }

    const detailMatch = /^\/projects\/([^/]+)\/merge_requests\/(\d+)\/(approvals|discussions|pipelines)$/
      .exec(apiPath);
    if (detailMatch) {
      const key = `${detailMatch[1]}-${detailMatch[2]}`;
      const resource = detailMatch[3];

      if (resource === 'approvals') {
        const entry = fixture.approvals?.[key];
        return resolveFixture(entry) ?? jsonResponse(entry);
      }

      if (resource === 'discussions') {
        const entry = fixture.discussions?.[key];
        return resolveFixture(entry) ?? paginatedResponse(entry, page);
      }

      const entry = fixture.pipelines?.[key];
      return resolveFixture(entry) ?? jsonResponse(entry);
    }

    const projectMatch = /^\/projects\/([^/]+)$/.exec(apiPath);
    if (projectMatch) {
      const entry = fixture.projects?.[projectMatch[1]];
      return resolveFixture(entry) ?? jsonResponse({ path_with_namespace: entry });
    }

    return errorResponse(404);
  }

  return { fetch: stubbedFetch, requestedUrls, sentHeaders };
}

export { buildMergeRequest, createGitLabStub };

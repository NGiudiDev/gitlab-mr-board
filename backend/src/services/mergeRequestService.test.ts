import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_TOKEN } from '../../test/constants.js';
import { buildMergeRequest, createGitLabStub, type GitLabFixture } from '../../test/fixtures/gitlab.js';
import { getAllMergeRequests } from './mergeRequestService.js';

/** Fixture base: los dos proyectos configurados (101 y 202) sin MRs abiertos. */
function baseFixture(overrides: GitLabFixture = {}): GitLabFixture {
  return {
    projects: { 101: 'equipo/tablero', 202: 'equipo/api' },
    mergeRequestPages: { 101: [[]], 202: [[]] },
    approvals: {},
    discussions: {},
    pipelines: {},
    ...overrides,
  };
}

function stubGitLab(fixture: GitLabFixture) {
  const stub = createGitLabStub(fixture);
  vi.stubGlobal('fetch', stub.fetch);
  return stub;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getAllMergeRequests', () => {
  it('devuelve metadatos con los proyectos configurados', async () => {
    stubGitLab(baseFixture());

    const { meta, mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests).toEqual([]);
    expect(meta.projectCount).toBe(2);
    expect(meta.totalMRs).toBe(0);
    expect(meta.allProjects).toEqual(['equipo/tablero', 'equipo/api']);
    expect(Number.isNaN(Date.parse(meta.fetchedAt))).toBe(false);
  });

  it('enriquece un MR con aprobaciones, hilos y pipeline', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: {
        101: [[buildMergeRequest({
          iid: 7,
          labels: ['qa_approved'],
          reviewers: [{ name: 'Beto Ruiz', username: 'beto', avatar_url: null }],
        })]],
        202: [[]],
      },
      approvals: { '101-7': { approved_by: [{ user: { username: 'beto' } }, { user: { username: 'lider' } }] } },
      discussions: { '101-7': [[{ notes: [{ resolvable: true, resolved: true }] }]] },
      pipelines: { '101-7': [{ status: 'success', web_url: 'https://gitlab.example.com/pipe/9' }] },
    }));

    const { mergeRequests } = await getAllMergeRequests();
    const [mr] = mergeRequests;

    expect(mr?.id).toBe('101-7');
    expect(mr?.projectPath).toBe('equipo/tablero');
    expect(mr?.reviewers).toEqual([{ name: 'Beto Ruiz', username: 'beto', avatar: null }]);
    expect(mr?.blockers.approvals).toMatchObject({
      status: 'approved', given: 2, required: 2, hasLeadApproval: true,
    });
    expect(mr?.blockers.threads).toEqual({ status: 'resolved', unresolvedCount: 0 });
    expect(mr?.blockers.pipeline).toEqual({ status: 'success', pipelineUrl: 'https://gitlab.example.com/pipe/9' });
    expect(mr?.mergeability).toBe('green');
  });

  it('marca las aprobaciones como pendientes sin la del líder', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: { 101: [[buildMergeRequest({ iid: 7, labels: ['qa_approved'] })]], 202: [[]] },
      approvals: { '101-7': { approved_by: [{ user: { username: 'ana' } }, { user: { username: 'beto' } }] } },
      discussions: { '101-7': [[]] },
      pipelines: { '101-7': [{ status: 'success' }] },
    }));

    const { mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests[0]?.blockers.approvals.hasLeadApproval).toBe(false);
    expect(mergeRequests[0]?.mergeability).toBe('review');
  });

  it('cuenta las discusiones que tienen notas sin resolver', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: { 101: [[buildMergeRequest({ iid: 7 })]], 202: [[]] },
      discussions: {
        '101-7': [[
          { notes: [{ resolvable: true, resolved: false }] },
          { notes: [{ resolvable: true, resolved: true }] },
          { notes: [{ resolvable: false }] },
          { notes: [{ resolvable: true, resolved: false }, { resolvable: true, resolved: true }] },
        ]],
      },
      pipelines: { '101-7': [{ status: 'success' }] },
    }));

    const { mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests[0]?.blockers.threads).toEqual({ status: 'open', unresolvedCount: 2 });
    expect(mergeRequests[0]?.mergeability).toBe('yellow');
  });

  it('ordena los MRs por fecha de actualización descendente', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: {
        101: [[
          buildMergeRequest({ iid: 1, updated_at: '2026-08-01T10:00:00.000Z' }),
          buildMergeRequest({ iid: 2, updated_at: '2026-08-25T10:00:00.000Z' }),
        ]],
        202: [[buildMergeRequest({ project_id: 202, iid: 3, updated_at: '2026-08-10T10:00:00.000Z' })]],
      },
    }));

    const { mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests.map((mr) => mr.iid)).toEqual([2, 3, 1]);
  });

  it('recorre todas las páginas de merge requests', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: {
        101: [
          [buildMergeRequest({ iid: 1, updated_at: '2026-08-03T10:00:00.000Z' })],
          [buildMergeRequest({ iid: 2, updated_at: '2026-08-02T10:00:00.000Z' })],
        ],
        202: [[]],
      },
    }));

    const { mergeRequests, meta } = await getAllMergeRequests();

    expect(meta.totalMRs).toBe(2);
    expect(mergeRequests.map((mr) => mr.iid)).toEqual([1, 2]);
  });

  it('devuelve los MRs de los proyectos que sí respondieron', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: { 101: 500, 202: [[buildMergeRequest({ project_id: 202, iid: 4 })]] },
    }));

    const { mergeRequests, meta } = await getAllMergeRequests();

    expect(mergeRequests.map((mr) => mr.iid)).toEqual([4]);
    expect(meta.totalMRs).toBe(1);
  });

  it('usa un nombre de respaldo cuando no puede leer el proyecto', async () => {
    stubGitLab(baseFixture({ projects: { 101: 404, 202: 'equipo/api' } }));

    const { meta } = await getAllMergeRequests();

    expect(meta.allProjects).toEqual(['project-101', 'equipo/api']);
  });

  it('marca como desconocidos los bloqueos que GitLab no devuelve', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: { 101: [[buildMergeRequest({ iid: 7, labels: ['qa_approved'] })]], 202: [[]] },
      approvals: { '101-7': 401 },
      discussions: { '101-7': 500 },
      pipelines: { '101-7': 404 },
    }));

    const { mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests[0]?.blockers.approvals).toEqual({
      status: 'unknown', required: 0, given: 0, missingApprovers: [],
    });
    expect(mergeRequests[0]?.blockers.threads).toEqual({ status: 'unknown', unresolvedCount: 0 });
    expect(mergeRequests[0]?.blockers.pipeline).toEqual({ status: 'none', pipelineUrl: null });
    expect(mergeRequests[0]?.mergeability).toBe('green');
  });

  it('trata un MR sin pipelines como sin CI', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: { 101: [[buildMergeRequest({ iid: 7 })]], 202: [[]] },
      pipelines: { '101-7': [] },
    }));

    const { mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests[0]?.blockers.pipeline).toEqual({ status: 'none', pipelineUrl: null });
  });

  it('completa con valores neutros los campos ausentes del MR', async () => {
    stubGitLab(baseFixture({
      mergeRequestPages: {
        101: [[buildMergeRequest({
          iid: 7, author: null, labels: undefined, reviewers: undefined, work_in_progress: true,
        })]],
        202: [[]],
      },
    }));

    const { mergeRequests } = await getAllMergeRequests();

    expect(mergeRequests[0]?.author).toBe('desconocido');
    expect(mergeRequests[0]?.authorAvatar).toBeNull();
    expect(mergeRequests[0]?.labels).toEqual([]);
    expect(mergeRequests[0]?.reviewers).toEqual([]);
    expect(mergeRequests[0]?.isDraft).toBe(true);
  });

  it('envía el token en la cabecera y nunca en la URL', async () => {
    const stub = stubGitLab(baseFixture({
      mergeRequestPages: { 101: [[buildMergeRequest({ iid: 7 })]], 202: [[]] },
    }));

    await getAllMergeRequests();

    expect(stub.requestedUrls.length).toBeGreaterThan(0);
    expect(stub.requestedUrls.some((url) => url.includes(TEST_TOKEN))).toBe(false);
    expect(stub.sentHeaders.every((headers) => headers['PRIVATE-TOKEN'] === TEST_TOKEN)).toBe(true);
  });

  it('no incluye el token en la respuesta ni en los logs de error', async () => {
    stubGitLab(baseFixture({ mergeRequestPages: { 101: 401, 202: [[]] } }));

    const result = await getAllMergeRequests();
    const loggedText = vi.mocked(console.error).mock.calls.flat().map(String).join(' ');

    expect(JSON.stringify(result)).not.toContain(TEST_TOKEN);
    expect(loggedText).not.toContain(TEST_TOKEN);
    expect(loggedText).toContain('Error al obtener MRs del proyecto 101');
  });
});

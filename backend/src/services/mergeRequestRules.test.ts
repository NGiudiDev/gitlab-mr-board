import { describe, expect, it } from 'vitest';

import { buildMergeRequest } from '../../test/fixtures/gitlab.js';
import type { ApprovalStatus, PipelineStatus, ThreadStatus } from '../types.js';
import { 
  collectPeople,
  computeMergeability,
  computeResponsiblePeople,
  extractProjectPath
} from './mergeRequestRules.js';

const approved: ApprovalStatus = {
  status: 'approved', required: 2, given: 2, approvers: ['ana', 'lider'], hasLeadApproval: true,
};
const pendingApprovals: ApprovalStatus = {
  status: 'pending', required: 2, given: 1, approvers: ['ana'], hasLeadApproval: false,
};
const resolvedThreads: ThreadStatus = { status: 'resolved', unresolvedCount: 0 };
const openThreads: ThreadStatus = { status: 'open', unresolvedCount: 2 };
const successPipeline: PipelineStatus = { status: 'success', pipelineUrl: 'https://gitlab.example.com/pipe/1' };

function pipeline(status: string): PipelineStatus {
  return { status, pipelineUrl: null };
}

describe('computeMergeability', () => {
  it('prioriza backlog por encima de cualquier otro estado', () => {
    const mr = buildMergeRequest({
      labels: ['backlog', 'qa_pending'], draft: true, has_conflicts: true,
    });

    expect(computeMergeability(mr, pendingApprovals, openThreads, pipeline('failed'))).toBe('backlog');
  });

  it('clasifica como in_progress un draft', () => {
    const mr = buildMergeRequest({ draft: true });

    expect(computeMergeability(mr, approved, resolvedThreads, successPipeline)).toBe('in_progress');
  });

  it('clasifica como in_progress un work in progress', () => {
    const mr = buildMergeRequest({ draft: false, work_in_progress: true });

    expect(computeMergeability(mr, approved, resolvedThreads, successPipeline)).toBe('in_progress');
  });

  it('prioriza los bloqueos técnicos sobre la etiqueta qa_pending', () => {
    const mr = buildMergeRequest({ labels: ['qa_pending'], has_conflicts: true });

    expect(computeMergeability(mr, pendingApprovals, openThreads, pipeline('failed'))).toBe('mr_warning');
  });

  it('clasifica como mr_warning un MR con conflictos', () => {
    const mr = buildMergeRequest({ has_conflicts: true, labels: ['qa_approved'] });

    expect(computeMergeability(mr, approved, resolvedThreads, successPipeline)).toBe('mr_warning');
  });

  it('clasifica como mr_warning las discusiones abiertas', () => {
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, approved, openThreads, successPipeline)).toBe('mr_warning');
  });

  it.each(['failed', 'canceled'])('clasifica como mr_warning el pipeline %s', (status) => {
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, approved, resolvedThreads, pipeline(status))).toBe('mr_warning');
  });

  it.each(['running', 'pending'])('clasifica como mr_warning el pipeline %s', (status) => {
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, approved, resolvedThreads, pipeline(status))).toBe('mr_warning');
  });

  it('un pipeline en ejecución gana sobre las aprobaciones pendientes', () => {
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, pendingApprovals, resolvedThreads, pipeline('running'))).toBe('mr_warning');
  });

  it('clasifica como review las aprobaciones pendientes', () => {
    const mr = buildMergeRequest({ labels: [] });

    expect(computeMergeability(mr, pendingApprovals, resolvedThreads, successPipeline)).toBe('review');
  });

  it('clasifica como unknown cuando no coincide ninguna regla', () => {
    const mr = buildMergeRequest({ labels: [] });

    expect(computeMergeability(mr, approved, resolvedThreads, successPipeline)).toBe('unknown');
  });

  it('clasifica como ready_to_merge cuando tiene qa_approved', () => {
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, approved, resolvedThreads, successPipeline)).toBe('ready_to_merge');
  });

  it('compara las etiquetas sin distinguir mayúsculas de minúsculas', () => {
    const backlog = buildMergeRequest({ labels: ['BackLog'] });
    const qaPending = buildMergeRequest({ labels: ['QA_Pending'] });
    const qaApproved = buildMergeRequest({ labels: ['QA_APPROVED'] });

    expect(computeMergeability(backlog, approved, resolvedThreads, successPipeline)).toBe('backlog');
    expect(computeMergeability(qaPending, approved, resolvedThreads, successPipeline)).toBe('qa');
    expect(computeMergeability(qaApproved, approved, resolvedThreads, successPipeline)).toBe('ready_to_merge');
  });

  it('trata un pipeline inexistente como no bloqueante', () => {
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, approved, resolvedThreads, pipeline('none'))).toBe('ready_to_merge');
  });

  it('no bloquea cuando el estado de las aprobaciones es desconocido', () => {
    const unknownApprovals: ApprovalStatus = { status: 'unknown', required: 0, given: 0 };
    const mr = buildMergeRequest({ labels: ['qa_approved'] });

    expect(computeMergeability(mr, unknownApprovals, resolvedThreads, successPipeline)).toBe('ready_to_merge');
  });

  it('tolera un MR sin etiquetas definidas', () => {
    const mr = buildMergeRequest({ labels: undefined });

    expect(computeMergeability(mr, approved, resolvedThreads, successPipeline)).toBe('unknown');
  });
});

describe('computeResponsiblePeople', () => {
  const beto = { name: 'Beto Ruiz', username: 'beto', avatar_url: null };
  const caro = { name: 'Caro Díaz', username: 'caro', avatar_url: null };
  const ana = { name: 'Ana Pérez', username: 'ana' };

  it.each(['in_progress', 'mr_warning', 'qa', 'ready_to_merge'] as const)(
    'asigna el autor en %s',
    (mergeability) => {
      const mr = buildMergeRequest({ reviewers: [beto] });

      expect(computeResponsiblePeople(mr, mergeability, pendingApprovals)).toEqual([ana]);
    },
  );

  it.each(['backlog', 'unknown'] as const)('no asigna responsables en %s', (mergeability) => {
    const mr = buildMergeRequest({ reviewers: [beto] });

    expect(computeResponsiblePeople(mr, mergeability, pendingApprovals)).toEqual([]);
  });

  it('mantiene sólo los reviewers que todavía no aprobaron', () => {
    const mr = buildMergeRequest({ reviewers: [beto, caro] });
    const approvals: ApprovalStatus = { ...pendingApprovals, approvers: ['BETO'] };

    expect(computeResponsiblePeople(mr, 'review', approvals)).toEqual([
      { name: 'Caro Díaz', username: 'caro' },
    ]);
  });

  it('devuelve la responsabilidad al autor cuando todos los reviewers aprobaron', () => {
    const mr = buildMergeRequest({ reviewers: [beto, caro] });
    const approvals: ApprovalStatus = { ...pendingApprovals, approvers: ['beto', 'caro'] };

    expect(computeResponsiblePeople(mr, 'review', approvals)).toEqual([ana]);
  });

  it('no asigna responsable a una revisión sin reviewers', () => {
    const mr = buildMergeRequest({ reviewers: [] });

    expect(computeResponsiblePeople(mr, 'review', pendingApprovals)).toEqual([]);
  });

  it('no interpreta aprobaciones desconocidas como aprobaciones realizadas', () => {
    const mr = buildMergeRequest({ reviewers: [beto] });
    const unknownApprovals: ApprovalStatus = { status: 'unknown', required: 0, given: 0 };

    expect(computeResponsiblePeople(mr, 'review', unknownApprovals)).toEqual([
      { name: 'Beto Ruiz', username: 'beto' },
    ]);
  });

  it('omite al autor cuando GitLab no informa su username', () => {
    const mr = buildMergeRequest({ author: null });

    expect(computeResponsiblePeople(mr, 'in_progress', pendingApprovals)).toEqual([]);
  });
});

describe('collectPeople', () => {
  function participants(
    author: string,
    authorUsername: string | null,
    reviewers: Array<{ name: string; username: string }> = [],
  ) {
    return {
      author,
      authorUsername,
      reviewers: reviewers.map((reviewer) => ({ ...reviewer, avatar: null })),
    };
  }

  it('reúne y ordena autores y reviewers sin duplicar usernames', () => {
    const people = collectPeople([
      participants('Ana Pérez', 'Ana', [{ name: 'Beto Ruiz', username: 'beto' }]),
      participants('Beto Ruiz', 'BETO', [{ name: 'Otra Ana', username: 'ana' }]),
    ]);

    expect(people).toEqual([
      { name: 'Ana Pérez', username: 'Ana' },
      { name: 'Beto Ruiz', username: 'beto' },
    ]);
  });

  it('conserva personas distintas que comparten el nombre visible', () => {
    const people = collectPeople([
      participants('Alex', 'alex-uno'),
      participants('Alex', 'alex-dos'),
    ]);

    expect(people.map((person) => person.username)).toEqual(['alex-dos', 'alex-uno']);
  });

  it('ignora a los autores sin username', () => {
    expect(collectPeople([participants('desconocido', null)])).toEqual([]);
  });
});

describe('extractProjectPath', () => {
  it('usa la referencia completa de GitLab', () => {
    const mr = buildMergeRequest({ references: { full: 'equipo/sub/tablero!42' } });

    expect(extractProjectPath(mr)).toBe('equipo/sub/tablero');
  });

  it('recurre a la URL cuando no hay referencia', () => {
    const mr = buildMergeRequest({
      references: undefined,
      web_url: 'https://gitlab.example.com/equipo/tablero/-/merge_requests/7',
    });

    expect(extractProjectPath(mr)).toBe('equipo/tablero');
  });

  it('recurre a la URL cuando la referencia no tiene separador', () => {
    const mr = buildMergeRequest({
      references: { full: 'equipo/tablero' },
      web_url: 'https://gitlab.example.com/equipo/otro/-/merge_requests/7',
    });

    expect(extractProjectPath(mr)).toBe('equipo/otro');
  });

  it('usa el ID del proyecto cuando la URL es inválida', () => {
    const mr = buildMergeRequest({ references: undefined, web_url: 'no-es-una-url', project_id: 555 });

    expect(extractProjectPath(mr)).toBe('project-555');
  });
});

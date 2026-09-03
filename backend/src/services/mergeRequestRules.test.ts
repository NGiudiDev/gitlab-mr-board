import { describe, expect, it } from 'vitest';
import { buildMergeRequest } from '../../test/fixtures/gitlab.js';
import { computeMergeability, extractProjectPath } from './mergeRequestRules.js';
import type { ApprovalStatus, PipelineStatus, ThreadStatus } from '../types.js';

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

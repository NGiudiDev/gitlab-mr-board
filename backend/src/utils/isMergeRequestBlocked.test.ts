import { describe, expect, it } from 'vitest';
import { buildMergeRequest } from '../../test/fixtures/gitlab.js';
import { hasMergeRequestWarning, isMergeRequestBlocked } from './isMergeRequestBlocked.js';
import type { PipelineStatus, ThreadStatus } from '../types.js';

const resolvedThreads: ThreadStatus = { status: 'resolved', unresolvedCount: 0 };
const openThreads: ThreadStatus = { status: 'open', unresolvedCount: 2 };
const successPipeline: PipelineStatus = { status: 'success', pipelineUrl: null };

function pipeline(status: string): PipelineStatus {
  return { status, pipelineUrl: null };
}

describe('isMergeRequestBlocked', () => {
  it('detecta un MR con conflictos', () => {
    const mr = buildMergeRequest({ has_conflicts: true });

    expect(isMergeRequestBlocked(mr, resolvedThreads, successPipeline)).toBe(true);
  });

  it.each(['failed', 'canceled'])('detecta el pipeline %s', (status) => {
    const mr = buildMergeRequest();

    expect(isMergeRequestBlocked(mr, resolvedThreads, pipeline(status))).toBe(true);
  });

  it('detecta discusiones sin resolver', () => {
    const mr = buildMergeRequest();

    expect(isMergeRequestBlocked(mr, openThreads, successPipeline)).toBe(true);
  });

  it.each(['running', 'pending'])('no considera bloqueo el pipeline %s', (status) => {
    const mr = buildMergeRequest();

    expect(isMergeRequestBlocked(mr, resolvedThreads, pipeline(status))).toBe(false);
  });

  it('no considera bloqueo un pipeline exitoso sin conflictos ni discusiones', () => {
    const mr = buildMergeRequest();

    expect(isMergeRequestBlocked(mr, resolvedThreads, successPipeline)).toBe(false);
  });

  it('no considera bloqueo un estado de pipeline o discusiones desconocido', () => {
    const mr = buildMergeRequest();
    const unknownThreads: ThreadStatus = { status: 'unknown', unresolvedCount: 0 };

    expect(isMergeRequestBlocked(mr, unknownThreads, pipeline('unknown'))).toBe(false);
  });
});

describe('hasMergeRequestWarning', () => {
  it.each(['failed', 'canceled', 'running', 'pending'])('advierte sobre el pipeline %s', (status) => {
    const mr = buildMergeRequest();

    expect(hasMergeRequestWarning(mr, resolvedThreads, pipeline(status))).toBe(true);
  });

  it('advierte sobre un MR con conflictos', () => {
    const mr = buildMergeRequest({ has_conflicts: true });

    expect(hasMergeRequestWarning(mr, resolvedThreads, successPipeline)).toBe(true);
  });

  it('advierte sobre discusiones sin resolver', () => {
    const mr = buildMergeRequest();

    expect(hasMergeRequestWarning(mr, openThreads, successPipeline)).toBe(true);
  });

  it('no advierte sobre un MR sin bloqueos y con pipeline terminado', () => {
    const mr = buildMergeRequest();

    expect(hasMergeRequestWarning(mr, resolvedThreads, successPipeline)).toBe(false);
  });

  it('no advierte cuando el pipeline o las discusiones son desconocidos', () => {
    const mr = buildMergeRequest();
    const unknownThreads: ThreadStatus = { status: 'unknown', unresolvedCount: 0 };

    expect(hasMergeRequestWarning(mr, unknownThreads, pipeline('unknown'))).toBe(false);
  });
});

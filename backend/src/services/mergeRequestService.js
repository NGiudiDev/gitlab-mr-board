const config = require('../config');
const { fetchPaginatedWithLimit, fetchWithLimit } = require('./gitlabApi');


async function fetchOpenMRsForProject(projectId) {
  return fetchPaginatedWithLimit(`/projects/${projectId}/merge_requests`, {
    state: 'opened',
    scope: 'all',
    order_by: 'updated_at',
    sort: 'desc',
  });
}

async function fetchApprovals(projectId, mrIid) {
  try {
    const { data } = await fetchWithLimit(
      `/projects/${projectId}/merge_requests/${mrIid}/approvals`
    );
    const approvedBy = data.approved_by || [];
    const given = approvedBy.length;
    const approvers = approvedBy.map((a) => a.user.username);
    const hasLeadApproval = approvers.includes(config.teamLeadUsername);
    const isApproved = given >= config.minApprovals && hasLeadApproval;

    return {
      status: isApproved ? 'approved' : 'pending',
      required: config.minApprovals,
      given,
      approvers,
      hasLeadApproval,
      missingApprovers: [],
    };
  } catch {
    return { status: 'unknown', required: 0, given: 0, missingApprovers: [] };
  }
}

async function fetchUnresolvedThreads(projectId, mrIid) {
  try {
    const discussions = await fetchPaginatedWithLimit(
      `/projects/${projectId}/merge_requests/${mrIid}/discussions`
    );
    let unresolvedCount = 0;
    for (const discussion of discussions) {
      const hasUnresolved = (discussion.notes || []).some(
        (note) => note.resolvable && !note.resolved
      );
      if (hasUnresolved) unresolvedCount++;
    }
    return {
      status: unresolvedCount > 0 ? 'open' : 'resolved',
      unresolvedCount,
    };
  } catch {
    return { status: 'unknown', unresolvedCount: 0 };
  }
}

function extractPipeline(mr) {
  const pipeline = mr.head_pipeline || mr.pipeline;
  if (!pipeline) return { status: 'none', pipelineUrl: null };
  return {
    status: pipeline.status || 'unknown',
    pipelineUrl: pipeline.web_url || null,
  };
}

async function fetchPipeline(projectId, mrIid) {
  try {
    const { data } = await fetchWithLimit(
      `/projects/${projectId}/merge_requests/${mrIid}/pipelines`
    );
    const pipelines = Array.isArray(data) ? data : [];
    if (pipelines.length === 0) return { status: 'none', pipelineUrl: null };
    const latest = pipelines[0];
    return {
      status: latest.status || 'unknown',
      pipelineUrl: latest.web_url || null,
    };
  } catch {
    return { status: 'none', pipelineUrl: null };
  }
}

function computeMergeability(mr, approvals, threads, pipeline) {
  const labels = (mr.labels || []).map((l) => l.toLowerCase());
  if (labels.includes('backlog')) return 'backlog';
  if (mr.draft || mr.work_in_progress) return 'gray';

  const hasQa = labels.includes('qa_approved');
  const isBlocked = mr.has_conflicts
    || pipeline.status === 'failed' || pipeline.status === 'canceled'
    || threads.status === 'open';

  if (hasQa && isBlocked) return 'attention';

  if (isBlocked) return 'red';
  if (approvals.status === 'pending') return 'review';
  if (pipeline.status === 'running' || pipeline.status === 'pending') return 'yellow';
  if (!hasQa) return 'yellow';

  return 'green';
}

function extractProjectPath(mr) {
  const ref = mr.references && mr.references.full;
  if (ref) {
    const idx = ref.lastIndexOf('!');
    if (idx > -1) return ref.slice(0, idx);
  }
  try {
    const url = new URL(mr.web_url);
    return url.pathname.split('/-/merge_requests/')[0].replace(/^\//, '');
  } catch {
    return `project-${mr.project_id}`;
  }
}

async function enrichMR(mr) {
  const projectId = mr.project_id;
  const iid = mr.iid;

  const [approvals, threads, pipeline] = await Promise.all([
    fetchApprovals(projectId, iid),
    fetchUnresolvedThreads(projectId, iid),
    fetchPipeline(projectId, iid),
  ]);
  const mergeability = computeMergeability(mr, approvals, threads, pipeline);
  return {
    id: `${projectId}-${iid}`,
    iid,
    title: mr.title,
    url: mr.web_url,
    author: mr.author ? mr.author.name : 'desconocido',
    authorAvatar: mr.author ? mr.author.avatar_url : null,
    projectPath: extractProjectPath(mr),
    projectId,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    labels: mr.labels || [],
    isDraft: Boolean(mr.draft || mr.work_in_progress),
    hasConflicts: Boolean(mr.has_conflicts),
    reviewers: (mr.reviewers || []).map((r) => ({
      name: r.name,
      username: r.username,
      avatar: r.avatar_url,
    })),
    updatedAt: mr.updated_at,
    createdAt: mr.created_at,
    blockers: {
      approvals,
      threads,
      pipeline,
    },
    mergeability,
  };
}

async function getAllMergeRequests() {
  const projectResults = await Promise.all(
    config.projectIds.map((id) =>
      fetchOpenMRsForProject(id).catch((err) => {
        console.error(`Error fetching MRs for project ${id}:`, err.message);
        return [];
      })
    )
  );

  const allMRs = projectResults.flat();

  const enriched = await Promise.all(allMRs.map((mr) => enrichMR(mr)));

  enriched.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return {
    mergeRequests: enriched,
    meta: {
      fetchedAt: new Date().toISOString(),
      projectCount: config.projectIds.length,
      totalMRs: enriched.length,
    },
  };
}

module.exports = { getAllMergeRequests };

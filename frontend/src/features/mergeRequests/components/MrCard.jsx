// 6. Imports relativos restantes.
import { BlockerBadge } from "./BlockerBadge.jsx";

const COLOR_BY_MERGEABILITY = {
  ready_to_merge: "border-l-ready",
  mr_warning: "border-l-draft",
  in_progress: "border-l-text-faint",
  review: "border-l-blue-400",
  qa: "border-l-purple-400",
  backlog: "border-l-text-muted",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}

export function MrCard({ mr }) {
  const assignee = mr.responsiblePeople.map((person) => person.name).join(", ");
  const color = COLOR_BY_MERGEABILITY[mr.mergeability] || "border-l-text-faint";

  return (
    <article className={`bg-surface-raised border-l-[3px] ${color} rounded-md p-2.5 px-3 border border-border-soft`}>
      <a
        className="text-[13px] leading-snug block mb-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        href={mr.url}
        rel="noopener"
        target="_blank"
      >
        {mr.title}
        <span className="sr-only">(abre en una pestaña nueva)</span>
      </a>

      <div className="font-mono text-[10.5px] text-text-faint truncate">
        {mr.sourceBranch} → {mr.targetBranch}
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <BlockerBadge data={mr.blockers.pipeline} type="pipeline" />
        <BlockerBadge data={mr.blockers.threads} type="threads" />
        <BlockerBadge data={mr.blockers.approvals} type="approvals" />
        <BlockerBadge data={{ hasConflicts: mr.hasConflicts }} type="conflicts" />
      </div>

      {assignee ? (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[10px] font-semibold text-text-muted">Responsable:</span>
          <span className="text-[10px] text-text-primary">{assignee}</span>
        </div>
      ) : null}

      <div className="flex items-center mt-2">
        <span className="text-[11px] text-text-muted truncate">
          {mr.author} · {timeAgo(mr.updatedAt)}
        </span>
      </div>
    </article>
  );
}

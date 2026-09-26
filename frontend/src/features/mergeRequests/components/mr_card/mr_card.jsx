import { BlockerBadge } from "../blocker_badge/blocker_badge.jsx";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./mr_card.style.js";

const COLOR_BY_MERGEABILITY = {
  ready_to_merge: "var(--color-ready)",
  mr_warning: "var(--color-draft)",
  in_progress: "var(--color-text-faint)",
  review: "#60a5fa",
  qa: "#c084fc",
  backlog: "var(--color-text-muted)",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}

export function MrCard(props) {
  const { mr } = props;

  const assignee = mr.responsiblePeople.map((person) => person.name).join(", ");
  const color = COLOR_BY_MERGEABILITY[mr.mergeability] || "var(--color-text-faint)";

  return (
    <Styles.Card $color={color}>
      <Styles.TitleLink
        href={mr.url}
        rel="noopener"
        target="_blank"
      >
        {mr.title}
        <AppStyles.VisuallyHidden>(abre en una pestaña nueva)</AppStyles.VisuallyHidden>
      </Styles.TitleLink>

      <Styles.Branches>
        {mr.sourceBranch} → {mr.targetBranch}
      </Styles.Branches>

      <Styles.Badges>
        <BlockerBadge data={mr.blockers.pipeline} type="pipeline" />
        <BlockerBadge data={mr.blockers.threads} type="threads" />
        <BlockerBadge data={mr.blockers.approvals} type="approvals" />
        <BlockerBadge data={{ hasConflicts: mr.hasConflicts }} type="conflicts" />
      </Styles.Badges>

      {assignee ? (
        <Styles.Details>
          <Styles.DetailLabel>Responsable:</Styles.DetailLabel>
          <Styles.DetailValue>{assignee}</Styles.DetailValue>
        </Styles.Details>
      ) : null}

      <Styles.Details>
        <Styles.Metadata>
          {mr.author} · {timeAgo(mr.updatedAt)}
        </Styles.Metadata>
      </Styles.Details>
    </Styles.Card>
  );
}

import styled from "styled-components";

import { focusRingStyles, VisuallyHidden } from "../../../app/constants/styles.consts.js";

import { BlockerBadge } from "./BlockerBadge.jsx";

const COLOR_BY_MERGEABILITY = {
  ready_to_merge: "var(--color-ready)",
  mr_warning: "var(--color-draft)",
  in_progress: "var(--color-text-faint)",
  review: "#60a5fa",
  qa: "#c084fc",
  backlog: "var(--color-text-muted)",
};

const Card = styled.article`
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border-soft);
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
`;

const TitleLink = styled.a`
  display: block;
  margin-bottom: 0.375rem;
  border-radius: 0.125rem;
  font-size: 0.8125rem;
  line-height: 1.375;
  ${focusRingStyles}
`;

const Branches = styled.div`
  overflow: hidden;
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: 0.65625rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const Details = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
`;

const DetailLabel = styled.span`
  color: var(--color-text-muted);
  font-size: 0.625rem;
  font-weight: 600;
`;

const DetailValue = styled.span`
  color: var(--color-text-primary);
  font-size: 0.625rem;
`;

const Metadata = styled.span`
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

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
    <Card $color={color}>
      <TitleLink
        href={mr.url}
        rel="noopener"
        target="_blank"
      >
        {mr.title}
        <VisuallyHidden>(abre en una pestaña nueva)</VisuallyHidden>
      </TitleLink>

      <Branches>
        {mr.sourceBranch} → {mr.targetBranch}
      </Branches>

      <Badges>
        <BlockerBadge data={mr.blockers.pipeline} type="pipeline" />
        <BlockerBadge data={mr.blockers.threads} type="threads" />
        <BlockerBadge data={mr.blockers.approvals} type="approvals" />
        <BlockerBadge data={{ hasConflicts: mr.hasConflicts }} type="conflicts" />
      </Badges>

      {assignee ? (
        <Details>
          <DetailLabel>Responsable:</DetailLabel>
          <DetailValue>{assignee}</DetailValue>
        </Details>
      ) : null}

      <Details>
        <Metadata>
          {mr.author} · {timeAgo(mr.updatedAt)}
        </Metadata>
      </Details>
    </Card>
  );
}

import { useState } from "react";

import { BlockerBadge } from "../blocker_badge/blocker_badge.jsx";
import { MrDetailModal } from "../mr_detail_modal/mr_detail_modal.jsx";

import { Styles } from "./mr_card.style.js";

import { formatRelativeTime } from "../../utils/merge_request_format.utils.js";

const COLOR_BY_MERGEABILITY = {
  ready_to_merge: "var(--color-ready)",
  mr_warning: "var(--color-draft)",
  in_progress: "var(--color-text-faint)",
  review: "#60a5fa",
  qa: "#c084fc",
  backlog: "var(--color-text-muted)",
};

export function MrCard(props) {
  const { mr, onUploadDateChange = async () => {} } = props;

  const [detailOpen, setDetailOpen] = useState(false);

  const assignee = mr.responsiblePeople.map((person) => person.name).join(", ");
  const color = COLOR_BY_MERGEABILITY[mr.mergeability] || "var(--color-text-faint)";

  return (
    <>
      <Styles.Card $color={color}>
        <Styles.OpenButton
          aria-haspopup="dialog"
          aria-label={`Ver detalles de ${mr.title}`}
          onClick={() => setDetailOpen(true)}
          type="button"
        />

        <Styles.Title>{mr.title}</Styles.Title>

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
            {mr.author} · {formatRelativeTime(mr.updatedAt)}
          </Styles.Metadata>
        </Styles.Details>
      </Styles.Card>

      {detailOpen ? (
        <MrDetailModal
          mr={mr}
          onClose={() => setDetailOpen(false)}
          onUploadDateChange={onUploadDateChange}
        />
      ) : null}
    </>
  );
}

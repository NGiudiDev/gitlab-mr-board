import { useState } from "react";

import { MrBlockers } from "../mr_blockers/mr_blockers.jsx";
import { MrDetailModal } from "../mr_detail_modal/mr_detail_modal.jsx";

import { Styles } from "./mr_card.style.js";

import { formatRelativeTime } from "../../utils/merge_request_format.utils.js";
import { formatResponsiblePeople } from "../../utils/merge_request_people.utils.js";

import {
  COLOR_BY_MERGEABILITY,
  DEFAULT_MERGEABILITY_COLOR,
} from "../../constants/merge_request_card.consts.js";

export function MrCard(props) {
  const { mr, onUploadDateChange = async () => {} } = props;

  const [detailOpen, setDetailOpen] = useState(false);

  const assignee = formatResponsiblePeople(mr.responsiblePeople);
  const color = COLOR_BY_MERGEABILITY[mr.mergeability] || DEFAULT_MERGEABILITY_COLOR;

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
          <MrBlockers mr={mr} />
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

import { Styles } from "./mr_detail_fields.style.js";

import {
  formatMergeRequestDateTime,
  formatProjectName,
} from "../../utils/merge_request_format.utils.js";
import { formatResponsiblePeople } from "../../utils/merge_request_people.utils.js";

/** Ficha del merge request: autoría, ubicación y fechas. */
export function MrDetailFields(props) {
  const { mr } = props;

  const assignee = formatResponsiblePeople(mr.responsiblePeople);

  return (
    <Styles.Details>
      <div>
        <dt>Autor</dt>
        <dd>{mr.author}</dd>
      </div>

      <div>
        <dt>Responsable</dt>
        <dd>{assignee || "Sin responsable"}</dd>
      </div>

      <div>
        <dt>Proyecto</dt>
        <dd>{formatProjectName(mr.projectPath)}</dd>
      </div>

      <div>
        <dt>Merge request</dt>
        <dd>!{mr.iid}</dd>
      </div>

      <div>
        <dt>Creado</dt>
        <dd>{formatMergeRequestDateTime(mr.createdAt)}</dd>
      </div>

      <div>
        <dt>Actualizado</dt>
        <dd>{formatMergeRequestDateTime(mr.updatedAt)}</dd>
      </div>
    </Styles.Details>
  );
}

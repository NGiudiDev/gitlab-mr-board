import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { BoardColumn } from "../board_column/board_column.jsx";

import { Styles } from "./project_group.style.js";

import { splitIntoColumns } from "../../utils/merge_request_columns.utils.js";
import { toDomId } from "../../utils/dom_id.utils.js";

/** Un proyecto del tablero: su encabezado plegable y sus columnas de estado. */
export function ProjectGroup(props) {
  const {
    expanded = false,
    mergeRequests = [],
    onToggle = () => {},
    onUploadDateChange = async () => {},
    project,
  } = props;

  const domId = toDomId(project);
  const headingId = `proyecto-${domId}`;
  const panelId = `panel-${domId}`;

  return (
    <Styles.Project aria-labelledby={headingId}>
      <Styles.ProjectToggle
        aria-controls={panelId}
        aria-expanded={expanded}
        onClick={onToggle}
        type="button"
      >
        <Styles.Chevron $expanded={expanded} aria-hidden="true">
          ▶
        </Styles.Chevron>

        <Styles.ProjectName id={headingId}>
          {project}
        </Styles.ProjectName>

        <Styles.ProjectCount>
          {mergeRequests.length} <AppStyles.VisuallyHidden>merge requests</AppStyles.VisuallyHidden>
        </Styles.ProjectCount>
      </Styles.ProjectToggle>

      {/* `aria-controls` necesita que el panel permanezca en el DOM al contraerse. */}
      <Styles.Columns
        $expanded={expanded}
        aria-label="Columnas del proyecto"
        id={panelId}
        tabIndex={0}
      >
        {splitIntoColumns(mergeRequests).map((column) => (
          <BoardColumn
            idPrefix={domId}
            key={column.id}
            mergeRequests={column.mergeRequests}
            onUploadDateChange={onUploadDateChange}
            title={column.name}
          />
        ))}
      </Styles.Columns>
    </Styles.Project>
  );
}

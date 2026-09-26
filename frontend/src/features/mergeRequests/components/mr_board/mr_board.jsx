import { useState } from "react";

import { BoardColumn } from "../board_column/board_column.jsx";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./mr_board.style.js";

import { columnsOf } from "../../constants/merge_request_columns.consts.js";

function repoDomId(repo) {
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function groupByRepo(mergeRequests, allProjects) {
  const byRepo = {};
  allProjects.forEach((project) => { byRepo[project] = []; });
  mergeRequests.forEach((mr) => {
    if (!byRepo[mr.projectPath]) byRepo[mr.projectPath] = [];
    byRepo[mr.projectPath].push(mr);
  });

  return Object.keys(byRepo)
    .sort()
    .map((repo) => ({ repo, mrs: byRepo[repo] }));
}

export function MrBoard(props) {
  const { allProjects = [], mergeRequests } = props;

  const [expanded, setExpanded] = useState({});

  function toggle(repo) {
    setExpanded((current) => ({ ...current, [repo]: !current[repo] }));
  }

  return (
    <Styles.Projects>
      {groupByRepo(mergeRequests, allProjects).map((group) => {
        const domId = repoDomId(group.repo);
        const headingId = `proyecto-${domId}`;
        const panelId = `panel-${domId}`;
        const isExpanded = !!expanded[group.repo];

        return (
          <Styles.Project aria-labelledby={headingId} key={group.repo}>
            <Styles.ProjectToggle
              aria-controls={panelId}
              aria-expanded={isExpanded}
              onClick={() => toggle(group.repo)}
              type="button"
            >
              <Styles.Chevron $expanded={isExpanded} aria-hidden="true">
                ▶
              </Styles.Chevron>
              <Styles.ProjectName id={headingId}>
                {group.repo}
              </Styles.ProjectName>
              <Styles.ProjectCount>
                {group.mrs.length} <AppStyles.VisuallyHidden>merge requests</AppStyles.VisuallyHidden>
              </Styles.ProjectCount>
            </Styles.ProjectToggle>

            {/* `aria-controls` necesita que el panel permanezca en el DOM al contraerse. */}
            <Styles.Columns
              $expanded={isExpanded}
              aria-label="Columnas del proyecto"
              id={panelId}
              tabIndex={0}
            >
              {columnsOf(group.mrs).map((column) => (
                <BoardColumn
                  idPrefix={domId}
                  key={column.id}
                  mergeRequests={column.mergeRequests}
                  title={column.name}
                />
              ))}
            </Styles.Columns>
          </Styles.Project>
        );
      })}
    </Styles.Projects>
  );
}

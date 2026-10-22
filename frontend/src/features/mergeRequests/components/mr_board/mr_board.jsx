import { useState } from "react";

import { ProjectGroup } from "../project_group/project_group.jsx";

import { Styles } from "./mr_board.style.js";

import { groupByProject } from "../../utils/merge_request_group.utils.js";

export function MrBoard(props) {
  const {
    allProjects = [],
    mergeRequests,
    onUploadDateChange = async () => {},
  } = props;

  const [expanded, setExpanded] = useState({});

  function toggle(project) {
    setExpanded((current) => ({ ...current, [project]: !current[project] }));
  }

  return (
    <Styles.Projects>
      {groupByProject(mergeRequests, allProjects).map((group) => (
        <ProjectGroup
          expanded={Boolean(expanded[group.project])}
          key={group.project}
          mergeRequests={group.mergeRequests}
          onToggle={() => toggle(group.project)}
          onUploadDateChange={onUploadDateChange}
          project={group.project}
        />
      ))}
    </Styles.Projects>
  );
}

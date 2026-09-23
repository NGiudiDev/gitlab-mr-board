import { useState } from "react";
import styled from "styled-components";

import { focusRingStyles, VisuallyHidden } from "../../../app/constants/styles.consts.js";

import { columnsOf } from "../mergeRequestColumns.js";
import { BoardColumn } from "./BoardColumn.jsx";

const Projects = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Project = styled.section`
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
`;

const ProjectToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}

  &:focus-visible {
    outline-offset: -2px;
  }
`;

const Chevron = styled.span`
  color: var(--color-text-faint);
  font-size: 0.6875rem;
  transform: rotate(${({ $expanded }) => $expanded ? "90deg" : "0"});
  transition: transform 150ms ease;
`;

const ProjectName = styled.span`
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
`;

const ProjectCount = styled.span`
  margin-left: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  font-size: 0.6875rem;
`;

const Columns = styled.div`
  display: ${({ $expanded }) => $expanded ? "flex" : "none"};
  gap: 0.75rem;
  padding: 0.75rem;
  overflow-x: auto;
  border-top: 1px solid var(--color-border-soft);
`;

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
    <Projects>
      {groupByRepo(mergeRequests, allProjects).map((group) => {
        const domId = repoDomId(group.repo);
        const headingId = `proyecto-${domId}`;
        const panelId = `panel-${domId}`;
        const isExpanded = !!expanded[group.repo];

        return (
          <Project aria-labelledby={headingId} key={group.repo}>
            <ProjectToggle
              aria-controls={panelId}
              aria-expanded={isExpanded}
              onClick={() => toggle(group.repo)}
              type="button"
            >
              <Chevron $expanded={isExpanded} aria-hidden="true">
                ▶
              </Chevron>
              <ProjectName id={headingId}>
                {group.repo}
              </ProjectName>
              <ProjectCount>
                {group.mrs.length} <VisuallyHidden>merge requests</VisuallyHidden>
              </ProjectCount>
            </ProjectToggle>

            {/* `aria-controls` necesita que el panel permanezca en el DOM al contraerse. */}
            <Columns
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
            </Columns>
          </Project>
        );
      })}
    </Projects>
  );
}

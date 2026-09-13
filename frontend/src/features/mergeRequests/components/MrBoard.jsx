// 2. Dependencias externas.
import { useState } from "react";

// 6. Imports relativos restantes.
import { columnsOf } from "../mergeRequestColumns.js";
import { BoardColumn } from "./BoardColumn.jsx";

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

export function MrBoard({ allProjects = [], mergeRequests }) {
  const [expanded, setExpanded] = useState({});

  function toggle(repo) {
    setExpanded((current) => ({ ...current, [repo]: !current[repo] }));
  }

  return (
    <div className="flex flex-col gap-4">
      {groupByRepo(mergeRequests, allProjects).map((group) => {
        const domId = repoDomId(group.repo);
        const headingId = `proyecto-${domId}`;
        const panelId = `panel-${domId}`;
        const isExpanded = !!expanded[group.repo];

        return (
          <section
            aria-labelledby={headingId}
            className="border border-border rounded-lg bg-surface overflow-hidden"
            key={group.repo}
          >
            <button
              aria-controls={panelId}
              aria-expanded={isExpanded}
              className="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              onClick={() => toggle(group.repo)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`text-[11px] text-text-faint transition-transform ${isExpanded ? "rotate-90" : ""}`}
              >
                ▶
              </span>
              <span className="text-[13px] font-semibold text-text-primary font-mono" id={headingId}>
                {group.repo}
              </span>
              <span className="text-[11px] text-text-muted bg-surface-raised px-2 py-0.5 rounded-full ml-1">
                {group.mrs.length} <span className="sr-only">merge requests</span>
              </span>
            </button>
            {/* El panel se mantiene en el DOM aunque esté contraído, como hacía
                `v-show`: `aria-controls` debe apuntar a un elemento existente. */}
            <div
              aria-label="Columnas del proyecto"
              className={`${isExpanded ? "flex" : "hidden"} gap-3 overflow-x-auto p-3 border-t border-border-soft`}
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
            </div>
          </section>
        );
      })}
    </div>
  );
}

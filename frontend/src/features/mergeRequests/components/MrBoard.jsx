import { useState } from 'react'
import BoardColumn from './BoardColumn.jsx'

const STATUS_ORDER = [
  { id: 'in_progress', name: 'En progreso' },
  { id: 'mr_warning', name: 'Pendientes' },
  { id: 'review', name: 'Code Review' },
  { id: 'qa', name: 'QA' },
  { id: 'ready_to_merge', name: 'Listas para mergear' },
  { id: 'backlog', name: 'Pausados' },
]

function repoDomId(repo) {
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function groupByRepo(mergeRequests, allProjects) {
  const byRepo = {}
  allProjects.forEach((project) => { byRepo[project] = [] })
  mergeRequests.forEach((mr) => {
    if (!byRepo[mr.projectPath]) byRepo[mr.projectPath] = []
    byRepo[mr.projectPath].push(mr)
  })

  return Object.keys(byRepo)
    .sort()
    .map((repo) => ({ repo, mrs: byRepo[repo] }))
}

function columnsOf(mrs) {
  return STATUS_ORDER.map((column) => ({
    ...column,
    mrs: mrs.filter((mr) => mr.mergeability === column.id),
  }))
}

function MrBoard({ mergeRequests, allProjects = [] }) {
  const [expanded, setExpanded] = useState({})

  function toggle(repo) {
    setExpanded((current) => ({ ...current, [repo]: !current[repo] }))
  }

  return (
    <div className="flex flex-col gap-4">
      {groupByRepo(mergeRequests, allProjects).map((group) => {
        const domId = repoDomId(group.repo)
        const headingId = `proyecto-${domId}`
        const panelId = `panel-${domId}`
        const isExpanded = !!expanded[group.repo]

        return (
          <section
            key={group.repo}
            className="border border-border rounded-lg bg-surface overflow-hidden"
            aria-labelledby={headingId}
          >
            <button
              type="button"
              onClick={() => toggle(group.repo)}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              className="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              <span
                className={`text-[11px] text-text-faint transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                aria-hidden="true"
              >
                ▶
              </span>
              <span id={headingId} className="text-[13px] font-semibold text-text-primary font-mono">
                {group.repo}
              </span>
              <span className="text-[11px] text-text-muted bg-surface-raised px-2 py-0.5 rounded-full ml-1">
                {group.mrs.length} <span className="sr-only">merge requests</span>
              </span>
            </button>
            {/* El panel se mantiene en el DOM aunque esté contraído, como hacía
                `v-show`: `aria-controls` debe apuntar a un elemento existente. */}
            <div
              id={panelId}
              className={`${isExpanded ? 'flex' : 'hidden'} gap-3 overflow-x-auto p-3 border-t border-border-soft`}
              tabIndex={0}
              aria-label="Columnas del proyecto"
            >
              {columnsOf(group.mrs).map((column) => (
                <BoardColumn
                  key={column.id}
                  title={column.name}
                  idPrefix={domId}
                  mergeRequests={column.mrs}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default MrBoard

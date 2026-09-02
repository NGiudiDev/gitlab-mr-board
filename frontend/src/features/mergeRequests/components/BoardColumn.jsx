import MrCard from './MrCard.jsx'

function BoardColumn({ title, idPrefix, mergeRequests }) {
  const headingId = `columna-${idPrefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section
      className="bg-surface-raised border border-border-soft rounded-lg min-w-[250px] max-w-[250px] flex flex-col"
      aria-labelledby={headingId}
    >
      <div className="px-3 py-2 border-b border-border-soft flex items-center justify-between">
        <h3 id={headingId} className="text-[12px] font-semibold text-text-muted">{title}</h3>
        <span className="text-[10.5px] text-text-faint bg-surface px-1.5 py-0.5 rounded-full">
          <span aria-hidden="true">{mergeRequests.length}</span>
          <span className="sr-only">{mergeRequests.length} merge requests</span>
        </span>
      </div>
      <ul className="overflow-y-auto p-2 flex flex-col gap-2 max-h-[60vh]" role="list">
        {mergeRequests.map((mr) => (
          <li key={mr.id}>
            <MrCard mr={mr} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default BoardColumn

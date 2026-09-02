function FilterChips({ projects, activeProjects = null, onToggle }) {
  const isActive = (project) => (activeProjects ? activeProjects.has(project) : true)

  return (
    <div className="flex gap-1.5 flex-wrap mt-2.5">
      {projects.map((project) => (
        <button
          key={project}
          type="button"
          onClick={() => onToggle(project)}
          aria-pressed={isActive(project)}
          className={`${isActive(project) ? 'border-accent bg-accent-soft text-text-primary' : 'border-border bg-surface text-text-muted'} font-mono text-[12px] px-2 py-1 rounded-md border cursor-pointer hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
        >
          {project}
        </button>
      ))}
    </div>
  )
}

export default FilterChips

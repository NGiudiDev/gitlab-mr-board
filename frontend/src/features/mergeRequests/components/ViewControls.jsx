import { findPersonByUsername } from '../personalView.js'

const VIEW_OPTIONS = [
  { id: 'general', label: 'General' },
  { id: 'personal', label: 'Personal' },
]

function ViewControls({
  viewMode = 'general',
  people = [],
  selectedUsername = '',
  selectedPersonName = '',
  onViewChange = () => {},
  onPersonChange = () => {},
}) {
  const buttonClasses = 'px-3 py-1.5 text-[13px] rounded-md border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
  const selectedPersonIsAvailable = Boolean(findPersonByUsername(people, selectedUsername))

  return (
    <section className="flex items-end gap-4 flex-wrap mb-4" aria-label="Configuración de la vista">
      <div>
        <span className="block text-[12px] font-semibold text-text-muted mb-1">Vista</span>
        <div className="flex gap-1" role="group" aria-label="Tipo de vista">
          {VIEW_OPTIONS.map((option) => {
            const isSelected = viewMode === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onViewChange(option.id)}
                className={`${buttonClasses} ${isSelected ? 'border-accent bg-surface-raised text-text-primary' : 'border-control text-text-muted'}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {viewMode === 'personal' ? (
        <label className="text-[12px] font-semibold text-text-muted">
          Persona
          <select
            value={selectedUsername}
            onChange={(event) => onPersonChange(event.target.value)}
            className="block mt-1 min-w-64 rounded-md border border-control bg-surface-raised px-3 py-1.5 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="">Elegí una persona</option>
            {selectedUsername && !selectedPersonIsAvailable ? (
              <option value={selectedUsername}>
                {selectedPersonName || `@${selectedUsername}`} (sin tareas actuales)
              </option>
            ) : null}
            {people.map((person) => (
              <option key={person.username.toLowerCase()} value={person.username}>
                {person.name} (@{person.username})
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </section>
  )
}

export default ViewControls

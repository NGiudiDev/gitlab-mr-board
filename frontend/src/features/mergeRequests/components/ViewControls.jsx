// 6. Imports relativos restantes.
import { findPersonByUsername } from '../personalView.js'

const VIEW_OPTIONS = [
  { id: 'general', label: 'General' },
  { id: 'personal', label: 'Personal' },
]

const OPTION_CLASSES = 'px-3 py-1 text-[13px] rounded cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Controles de la vista del tablero.
 *
 * `canChoosePerson` decide si la vista personal deja elegir a quién mirar. Sin
 * ese permiso la vista personal muestra siempre las tareas propias, así que el
 * selector sobra.
 */
function ViewControls({
  viewMode = 'general',
  people = [],
  selectedUsername = '',
  selectedPersonName = '',
  canChoosePerson = false,
  onViewChange = () => {},
  onPersonChange = () => {},
}) {
  const selectedPersonIsAvailable = Boolean(findPersonByUsername(people, selectedUsername))

  return (
    <section className="flex items-center gap-3 flex-wrap" aria-label="Configuración de la vista">
      <div
        className="inline-flex gap-0.5 rounded-md border border-control p-0.5"
        role="group"
        aria-label="Tipo de vista"
      >
        {VIEW_OPTIONS.map((option) => {
          const isSelected = viewMode === option.id

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onViewChange(option.id)}
              className={`${OPTION_CLASSES} ${isSelected
                ? 'bg-surface-raised font-semibold text-text-primary'
                : 'text-text-muted hover:text-text-primary'}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {viewMode === 'personal' && canChoosePerson ? (
        <label className="flex items-center gap-2 text-[12px] font-semibold text-text-muted">
          Persona
          <select
            value={selectedUsername}
            onChange={(event) => onPersonChange(event.target.value)}
            className="min-w-56 rounded-md border border-control bg-surface-raised px-3 py-1.5 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

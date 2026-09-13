// 6. Imports relativos restantes.
import { findPersonByUsername } from "../personalView.js";

const VIEW_OPTIONS = [
  { id: "general", label: "General" },
  { id: "personal", label: "Personal" },
];

const OPTION_CLASSES = "px-3 py-1 text-[13px] rounded cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Controles de la vista del tablero.
 *
 * `canChoosePerson` decide si la vista personal deja elegir a quién mirar. Sin
 * ese permiso la vista personal muestra siempre las tareas propias, así que el
 * selector sobra.
 */
export function ViewControls({
  canChoosePerson = false,
  onPersonChange = () => {},
  onViewChange = () => {},
  people = [],
  selectedPersonName = "",
  selectedUsername = "",
  viewMode = "general",
}) {
  const selectedPersonIsAvailable = Boolean(findPersonByUsername(people, selectedUsername));

  return (
    <section aria-label="Configuración de la vista" className="flex items-center gap-3 flex-wrap">
      <div
        aria-label="Tipo de vista"
        className="inline-flex gap-0.5 rounded-md border border-control p-0.5"
        role="group"
      >
        {VIEW_OPTIONS.map((option) => {
          const isSelected = viewMode === option.id;

          return (
            <button
              aria-pressed={isSelected}
              className={`${OPTION_CLASSES} ${isSelected
                ? "bg-surface-raised font-semibold text-text-primary"
                : "text-text-muted hover:text-text-primary"}`}
              key={option.id}
              onClick={() => onViewChange(option.id)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {viewMode === "personal" && canChoosePerson ? (
        <label className="flex items-center gap-2 text-[12px] font-semibold text-text-muted">
          Persona
          <select
            className="min-w-56 rounded-md border border-control bg-surface-raised px-3 py-1.5 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            onChange={(event) => onPersonChange(event.target.value)}
            value={selectedUsername}
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
  );
}

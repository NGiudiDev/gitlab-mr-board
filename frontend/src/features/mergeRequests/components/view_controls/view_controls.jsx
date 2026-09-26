import { Styles } from "./view_controls.style.js";

import { findPersonByUsername } from "../../utils/personal_view.utils.js";

const VIEW_OPTIONS = [
  { id: "general", label: "General" },
  { id: "personal", label: "Personal" },
];

export function ViewControls(props) {
  const {
    canChoosePerson = false,
    onPersonChange = () => {},
    onViewChange = () => {},
    people = [],
    selectedPersonName = "",
    selectedUsername = "",
    viewMode = "general",
  } = props;

  const selectedPersonIsAvailable = Boolean(findPersonByUsername(people, selectedUsername));

  return (
    <Styles.Controls aria-label="Configuración de la vista">
      <Styles.Options
        aria-label="Tipo de vista"
        role="group"
      >
        {VIEW_OPTIONS.map((option) => {
          const isSelected = viewMode === option.id;

          return (
            <Styles.Option
              $selected={isSelected}
              aria-pressed={isSelected}
              key={option.id}
              onClick={() => onViewChange(option.id)}
              type="button"
            >
              {option.label}
            </Styles.Option>
          );
        })}
      </Styles.Options>

      {viewMode === "personal" && canChoosePerson ? (
        <Styles.PersonLabel>
          Persona
          <Styles.PersonSelect
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
          </Styles.PersonSelect>
        </Styles.PersonLabel>
      ) : null}
    </Styles.Controls>
  );
}

import styled from "styled-components";

import { focusRingStyles } from "../../../app/constants/styles.consts.js";

import { findPersonByUsername } from "../personalView.js";

const VIEW_OPTIONS = [
  { id: "general", label: "General" },
  { id: "personal", label: "Personal" },
];

const Controls = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
`;

const Options = styled.div`
  display: inline-flex;
  gap: 0.125rem;
  padding: 0.125rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
`;

const Option = styled.button`
  padding: 0.25rem 0.75rem;
  border: 0;
  border-radius: 0.25rem;
  background: ${({ $selected }) => $selected ? "var(--color-surface-raised)" : "transparent"};
  color: ${({ $selected }) => $selected ? "var(--color-text-primary)" : "var(--color-text-muted)"};
  font-size: 0.8125rem;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  cursor: pointer;

  &:hover {
    color: var(--color-text-primary);
  }

  ${focusRingStyles}
`;

const PersonLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
`;

const PersonSelect = styled.select`
  min-width: 14rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 400;
  ${focusRingStyles}
`;

/**
 * Controles de la vista del tablero.
 *
 * `canChoosePerson` decide si la vista personal deja elegir a quién mirar. Sin
 * ese permiso la vista personal muestra siempre las tareas propias, así que el
 * selector sobra.
 */
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
    <Controls aria-label="Configuración de la vista">
      <Options
        aria-label="Tipo de vista"
        role="group"
      >
        {VIEW_OPTIONS.map((option) => {
          const isSelected = viewMode === option.id;

          return (
            <Option
              $selected={isSelected}
              aria-pressed={isSelected}
              key={option.id}
              onClick={() => onViewChange(option.id)}
              type="button"
            >
              {option.label}
            </Option>
          );
        })}
      </Options>

      {viewMode === "personal" && canChoosePerson ? (
        <PersonLabel>
          Persona
          <PersonSelect
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
          </PersonSelect>
        </PersonLabel>
      ) : null}
    </Controls>
  );
}

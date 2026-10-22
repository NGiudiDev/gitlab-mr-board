import { Styles } from "./register_account_choice.style.js";

/** Elección entre sumarse a un equipo existente o crear uno nuevo. */
export function RegisterAccountChoice(props) {
  const { joinExisting = true, onChange = () => {} } = props;

  return (
    <Styles.ChoiceFieldset>
      <Styles.ChoiceLegend>
        ¿Cómo querés entrar?
      </Styles.ChoiceLegend>

      <Styles.ChoiceGroup>
        <Styles.ChoiceButton
          $active={joinExisting}
          aria-pressed={joinExisting}
          onClick={() => onChange(true)}
          type="button"
        >
          Sumarme a un equipo
        </Styles.ChoiceButton>

        <Styles.ChoiceButton
          $active={!joinExisting}
          aria-pressed={!joinExisting}
          onClick={() => onChange(false)}
          type="button"
        >
          Crear un equipo
        </Styles.ChoiceButton>
      </Styles.ChoiceGroup>
    </Styles.ChoiceFieldset>
  );
}

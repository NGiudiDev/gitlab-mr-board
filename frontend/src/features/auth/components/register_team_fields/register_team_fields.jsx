import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./register_team_fields.style.js";

export function RegisterTeamFields(props) {
  const {
    accountName = "",
    inviteCode = "",
    joinExisting = true,
    onAccountNameChange = () => {},
    onInviteCodeChange = () => {},
  } = props;

  if (joinExisting) {
    return (
      <>
        <AppStyles.SpacedLabel htmlFor="registro-invitacion">
          Código de invitación
          <AppStyles.Field
            aria-describedby="registro-invitacion-ayuda"
            autoCapitalize="characters"
            id="registro-invitacion"
            name="inviteCode"
            onChange={(event) => onInviteCodeChange(event.target.value)}
            required
            spellCheck="false"
            type="text"
            value={inviteCode}
          />
        </AppStyles.SpacedLabel>

        <Styles.RegisterHint id="registro-invitacion-ayuda">
          Te lo da quien administra el tablero de tu equipo. Con él ves los mismos proyectos, sin cargar credenciales de GitLab.
        </Styles.RegisterHint>
      </>
    );
  }

  return (
    <>
      <AppStyles.SpacedLabel htmlFor="registro-cuenta">
        Nombre del equipo (opcional)
        <AppStyles.Field
          aria-describedby="registro-cuenta-ayuda"
          id="registro-cuenta"
          maxLength={80}
          name="accountName"
          onChange={(event) => onAccountNameChange(event.target.value)}
          type="text"
          value={accountName}
        />
      </AppStyles.SpacedLabel>

      <Styles.RegisterHint id="registro-cuenta-ayuda">
        Vas a quedar administrador: cargás una vez los proyectos y el access token de GitLab, y el resto del equipo se suma con un código.
      </Styles.RegisterHint>
    </>
  );
}

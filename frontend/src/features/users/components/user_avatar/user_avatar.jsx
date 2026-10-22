import { Styles } from "./user_avatar.style.js";

import { getUserInitials } from "../../utils/user.utils.js";

/**
 * Iniciales de la persona en lugar de una imagen.
 *
 * Es decorativo: el nombre accesible lo aporta el control que lo contiene.
 */
export function UserAvatar(props) {
  const { large = false, user = null } = props;

  return (
    <Styles.Avatar $large={large} aria-hidden="true">
      {getUserInitials(user)}
    </Styles.Avatar>
  );
}

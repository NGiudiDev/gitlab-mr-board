import { MenuIcon } from "../menu_icon/menu_icon.jsx";
import { UserAvatar } from "../user_avatar/user_avatar.jsx";

import { Styles } from "./logged_user_menu_panel.style.js";

import { isAdmin } from "../../utils/user.utils.js";

import { MENU_ICON_PATHS } from "../../constants/logged_user_menu.consts.js";

import { APP_PATHS } from "../../../../app/constants/routes.consts.js";

/** Contenido desplegable del menú de cuenta: identidad, equipo y acciones. */
export function LoggedUserMenuPanel(props) {
  const {
    accountName = "",
    id,
    onLogout = () => {},
    onNavigate = () => {},
    user = null,
  } = props;

  return (
    <Styles.MenuPanel aria-label="Menú de cuenta" id={id} role="region">
      <Styles.Identity>
        <UserAvatar large user={user} />

        <Styles.IdentityText>
          <Styles.TruncatedText>
            {user.displayName}
          </Styles.TruncatedText>

          <Styles.TruncatedText $muted>
            {user.email}
          </Styles.TruncatedText>
        </Styles.IdentityText>
      </Styles.Identity>

      <Styles.AccountDetails>
        <Styles.AccountTerm>
          Equipo
        </Styles.AccountTerm>

        <Styles.AccountName>
          {accountName}
        </Styles.AccountName>
      </Styles.AccountDetails>

      <Styles.MenuActions>
        <Styles.MenuLink onClick={onNavigate} to={APP_PATHS.profile}>
          <MenuIcon path={MENU_ICON_PATHS.profile} />
          Editar perfil
        </Styles.MenuLink>

        <Styles.MenuLink onClick={onNavigate} to={APP_PATHS.account}>
          <MenuIcon path={MENU_ICON_PATHS.account} />
          {isAdmin(user) ? "Editar cuenta" : "Ver cuenta"}
        </Styles.MenuLink>

        <Styles.MenuButton onClick={onLogout} type="button">
          <MenuIcon path={MENU_ICON_PATHS.logout} />
          Cerrar sesión
        </Styles.MenuButton>
      </Styles.MenuActions>
    </Styles.MenuPanel>
  );
}

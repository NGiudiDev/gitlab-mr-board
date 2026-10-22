import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./users_table.style.js";

import { isAdmin } from "../../utils/user.utils.js";
import { formatLastLogin, formatUserStatus } from "../../utils/user_format.utils.js";

import { USER_STATUS } from "../../constants/user.consts.js";

/** Personas de la cuenta, con el control para habilitarlas o deshabilitarlas. */
export function UsersTable(props) {
  const {
    busyEmail = null,
    currentEmail = "",
    onToggleStatus = () => {},
    users = [],
  } = props;

  return (
    <Styles.TableViewport>
      <Styles.UsersTable>
        <AppStyles.VisuallyHidden as="caption">
          Personas de la cuenta y sus permisos
        </AppStyles.VisuallyHidden>

        <Styles.TableHead>
          <tr>
            <Styles.HeaderCell scope="col">Email</Styles.HeaderCell>
            <Styles.HeaderCell scope="col">Nombre</Styles.HeaderCell>
            <Styles.HeaderCell scope="col">Rol</Styles.HeaderCell>
            <Styles.HeaderCell scope="col">Estado</Styles.HeaderCell>
            <Styles.HeaderCell scope="col">Último ingreso</Styles.HeaderCell>
            <Styles.HeaderCell $last scope="col">Acciones</Styles.HeaderCell>
          </tr>
        </Styles.TableHead>

        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.email === currentEmail;
            const isActive = user.status === USER_STATUS.active;

            return (
              <Styles.UserRow key={user.email}>
                <Styles.UserEmail scope="row">{user.email}</Styles.UserEmail>
                <Styles.UserCell>{user.displayName}</Styles.UserCell>
                <Styles.UserCell $muted>
                  {isAdmin(user) ? "Administrador" : "Usuario"}
                </Styles.UserCell>
                <Styles.UserCell $muted>{formatUserStatus(user.status)}</Styles.UserCell>
                <Styles.UserCell $muted>{formatLastLogin(user.lastLoginAt)}</Styles.UserCell>
                <Styles.UserCell $last>
                  <Styles.ActionButton
                    disabled={isCurrentUser || busyEmail === user.email}
                    onClick={() => onToggleStatus(user)}
                    title={isCurrentUser ? "No podés cambiar el estado de tu propia cuenta." : undefined}
                    type="button"
                  >
                    {isActive ? "Deshabilitar" : "Habilitar"}
                  </Styles.ActionButton>
                </Styles.UserCell>
              </Styles.UserRow>
            );
          })}
        </tbody>
      </Styles.UsersTable>
    </Styles.TableViewport>
  );
}

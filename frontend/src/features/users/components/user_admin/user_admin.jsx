import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { CreateUserForm } from "../create_user_form/create_user_form.jsx";
import { UsersTable } from "../users_table/users_table.jsx";

import { Styles } from "./user_admin.style.js";

import { useUserAdminActions } from "../../hooks/useUserAdminActions.js";

/**
 * Administración de usuarios: alta, habilitación y deshabilitación.
 *
 * Alcanza sólo a la cuenta de quien administra: quien se da de alta acá ve el
 * mismo tablero, con los proyectos y el token que ya están cargados. El backend
 * valida el rol y la cuenta en cada ruta; esconder los controles es sólo una
 * cortesía de la interfaz.
 */
export function UserAdmin(props) {
  const { currentEmail = "" } = props;

  const {
    busyEmail,
    createUser,
    error,
    loading,
    message,
    toggleStatus,
    users,
  } = useUserAdminActions();

  return (
    <Styles.AdminSection aria-labelledby="usuarios-heading">
      <AppStyles.SectionHeading id="usuarios-heading">
        Usuarios
      </AppStyles.SectionHeading>

      <AppStyles.SectionDescription>
        Las personas de tu cuenta. Todas ven el mismo tablero: no tienen que cargar credenciales de GitLab.
      </AppStyles.SectionDescription>

      {error ? (
        <AppStyles.Alert role="alert">
          {error}
        </AppStyles.Alert>
      ) : null}

      {message ? (
        <AppStyles.Alert $success role="status">
          {message}
        </AppStyles.Alert>
      ) : null}

      <CreateUserForm onCreate={createUser} submitting={busyEmail !== null} />

      {loading ? (
        <AppStyles.LoadingText role="status">Cargando usuarios...</AppStyles.LoadingText>
      ) : (
        <UsersTable
          busyEmail={busyEmail}
          currentEmail={currentEmail}
          onToggleStatus={toggleStatus}
          users={users}
        />
      )}
    </Styles.AdminSection>
  );
}

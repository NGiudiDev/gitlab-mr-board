import { useState } from "react";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { isAdmin } from "../../../accounts/utils/account.utils.js";

import { useUsers } from "../../hooks/useUsers.js";
import { Styles } from "./user_admin.style.js";

const EMPTY_FORM = { email: "", displayName: "", password: "", role: "user" };

/** Formatea una fecha ISO para la tabla, o avisa que nunca ocurrió. */
//TODO: pasar esto a un archivo de funciones.
function formatDate(isoDate) {
  if (!isoDate) return "Nunca";

  return new Date(isoDate).toLocaleDateString("es-AR");
}

function CreateUserForm(props) {
  const { onCreate = () => {}, submitting = false } = props;

  const [form, setForm] = useState(EMPTY_FORM);

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const created = await onCreate({ ...form, email: form.email.trim(), displayName: form.displayName.trim() });
    if (created) setForm(EMPTY_FORM);
  }

  return (
    <Styles.CreateForm aria-labelledby="alta-heading" onSubmit={handleSubmit}>
      <Styles.FormHeading id="alta-heading">
        Dar de alta un usuario en el equipo
      </Styles.FormHeading>

      <Styles.FormGrid>
        <AppStyles.Label htmlFor="alta-email">
          Email
          <AppStyles.Field
            autoCapitalize="none"
            autoComplete="email"
            id="alta-email"
            maxLength={254}
            name="email"
            onChange={updateField("email")}
            required
            spellCheck="false"
            type="email"
            value={form.email}
          />
        </AppStyles.Label>

        <AppStyles.Label htmlFor="alta-nombre">
          Nombre visible (opcional)
          <AppStyles.Field
            id="alta-nombre"
            maxLength={80}
            onChange={updateField("displayName")}
            type="text"
            value={form.displayName}
          />
        </AppStyles.Label>

        <AppStyles.Label htmlFor="alta-password">
          Contraseña inicial
          <AppStyles.Field
            autoComplete="new-password"
            id="alta-password"
            minLength={8}
            onChange={updateField("password")}
            required
            type="password"
            value={form.password}
          />
        </AppStyles.Label>

        <AppStyles.Label htmlFor="alta-rol">
          Rol
          <AppStyles.Field
            as="select"
            id="alta-rol"
            onChange={updateField("role")}
            value={form.role}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </AppStyles.Field>
        </AppStyles.Label>
      </Styles.FormGrid>

      <Styles.CreateButton disabled={submitting} type="submit">
        {submitting ? "Creando..." : "Crear usuario"}
      </Styles.CreateButton>
    </Styles.CreateForm>
  );
}

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

  const { users, loading, error, createUser, setStatus } = useUsers();
  const [actionError, setActionError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busyEmail, setBusyEmail] = useState(null);

  /** Ejecuta una acción sobre un usuario y presenta su resultado. */
  async function runAction(email, action, successMessage) {
    setBusyEmail(email);
    setActionError(null);
    setMessage(null);

    const failure = await action();

    setBusyEmail(null);
    if (failure) {
      setActionError(failure);
      return false;
    }

    setMessage(successMessage);
    return true;
  }

  async function handleCreate(user) {
    return await runAction(
      user.email,
      () => createUser(user),
      `Usuario «${user.email}» creado.`,
    );
  }

  function handleToggleStatus(user) {
    const nextStatus = user.status === "active" ? "disabled" : "active";

    return runAction(
      user.email,
      () => setStatus(user.email, nextStatus),
      nextStatus === "disabled"
        ? `Usuario «${user.email}» deshabilitado.`
        : `Usuario «${user.email}» habilitado.`,
    );
  }

  return (
    <Styles.AdminSection aria-labelledby="usuarios-heading">
      <AppStyles.SectionHeading id="usuarios-heading">
        Usuarios
      </AppStyles.SectionHeading>

      <AppStyles.SectionDescription>
        Las personas de tu cuenta. Todas ven el mismo tablero: no tienen que cargar credenciales de GitLab.
      </AppStyles.SectionDescription>

      {actionError || error ? (
        <AppStyles.Alert role="alert">
          {actionError ?? error}
        </AppStyles.Alert>
      ) : null}

      {message ? (
        <AppStyles.Alert $success role="status">
          {message}
        </AppStyles.Alert>
      ) : null}

      <CreateUserForm onCreate={handleCreate} submitting={busyEmail !== null} />

      {loading ? (
        <AppStyles.LoadingText role="status">Cargando usuarios...</AppStyles.LoadingText>
      ) : (
        <Styles.TableViewport>
          <Styles.UsersTable>
            <AppStyles.VisuallyHidden as="caption">Personas de la cuenta y sus permisos</AppStyles.VisuallyHidden>
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

                return (
                  <Styles.UserRow key={user.email}>
                    <Styles.UserEmail scope="row">
                      {user.email}
                    </Styles.UserEmail>
                    <Styles.UserCell>{user.displayName}</Styles.UserCell>
                    <Styles.UserCell $muted>
                      {isAdmin(user) ? "Administrador" : "Usuario"}
                    </Styles.UserCell>
                    <Styles.UserCell $muted>
                      {user.status === "active" ? "Habilitado" : "Deshabilitado"}
                    </Styles.UserCell>
                    <Styles.UserCell $muted>{formatDate(user.lastLoginAt)}</Styles.UserCell>
                    <Styles.UserCell $last>
                      <Styles.ActionButton
                        disabled={isCurrentUser || busyEmail === user.email}
                        onClick={() => handleToggleStatus(user)}
                        title={isCurrentUser ? "No podés cambiar el estado de tu propia cuenta." : undefined}
                        type="button"
                      >
                        {user.status === "active" ? "Deshabilitar" : "Habilitar"}
                      </Styles.ActionButton>
                    </Styles.UserCell>
                  </Styles.UserRow>
                );
              })}
            </tbody>
          </Styles.UsersTable>
        </Styles.TableViewport>
      )}
    </Styles.AdminSection>
  );
}

import { useState } from "react";
import styled from "styled-components";

import {
  Alert,
  Button,
  Field,
  focusRingStyles,
  Label,
  LoadingText,
  SectionDescription,
  SectionHeading,
  VisuallyHidden,
} from "../../../app/constants/styles.consts.js";

import { isAdmin } from "../../accounts/utils/account.utils.js";

import { useUsers } from "../hooks/useUsers.js";

const AdminSection = styled.section`
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
`;

const CreateForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormHeading = styled.h3`
  margin: 0 0 0.75rem;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const CreateButton = styled(Button)`
  margin-top: 0.75rem;
`;

const TableViewport = styled.div`
  overflow-x: auto;
`;

const UsersTable = styled.table`
  width: 100%;
  color: var(--color-text-primary);
  font-size: 0.78125rem;
  text-align: left;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  color: var(--color-text-muted);
`;

const HeaderCell = styled.th`
  padding: 0.5rem ${({ $last }) => $last ? 0 : "1rem"} 0.5rem 0;
  font-weight: 600;
`;

const UserRow = styled.tr`
  border-top: 1px solid var(--color-border-soft);
`;

const UserEmail = styled.th`
  padding: 0.5rem 1rem 0.5rem 0;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-weight: 400;
`;

const UserCell = styled.td`
  padding: 0.5rem ${({ $last }) => $last ? 0 : "1rem"} 0.5rem 0;
  color: ${({ $muted }) => $muted ? "var(--color-text-muted)" : "var(--color-text-primary)"};
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-control);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    border-color: var(--color-accent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ${focusRingStyles}
`;

const EMPTY_FORM = { email: "", displayName: "", password: "", role: "user" };

/** Formatea una fecha ISO para la tabla, o avisa que nunca ocurrió. */
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
    <CreateForm aria-labelledby="alta-heading" onSubmit={handleSubmit}>
      <FormHeading id="alta-heading">
        Dar de alta un usuario en el equipo
      </FormHeading>

      <FormGrid>
        <Label htmlFor="alta-email">
          Email
          <Field
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
        </Label>

        <Label htmlFor="alta-nombre">
          Nombre visible (opcional)
          <Field
            id="alta-nombre"
            maxLength={80}
            onChange={updateField("displayName")}
            type="text"
            value={form.displayName}
          />
        </Label>

        <Label htmlFor="alta-password">
          Contraseña inicial
          <Field
            autoComplete="new-password"
            id="alta-password"
            minLength={8}
            onChange={updateField("password")}
            required
            type="password"
            value={form.password}
          />
        </Label>

        <Label htmlFor="alta-rol">
          Rol
          <Field
            as="select"
            id="alta-rol"
            onChange={updateField("role")}
            value={form.role}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </Field>
        </Label>
      </FormGrid>

      <CreateButton disabled={submitting} type="submit">
        {submitting ? "Creando..." : "Crear usuario"}
      </CreateButton>
    </CreateForm>
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
    <AdminSection aria-labelledby="usuarios-heading">
      <SectionHeading id="usuarios-heading">
        Usuarios
      </SectionHeading>

      <SectionDescription>
        Las personas de tu cuenta. Todas ven el mismo tablero: no tienen que cargar credenciales de GitLab.
      </SectionDescription>

      {actionError || error ? (
        <Alert role="alert">
          {actionError ?? error}
        </Alert>
      ) : null}

      {message ? (
        <Alert $success role="status">
          {message}
        </Alert>
      ) : null}

      <CreateUserForm onCreate={handleCreate} submitting={busyEmail !== null} />

      {loading ? (
        <LoadingText role="status">Cargando usuarios...</LoadingText>
      ) : (
        <TableViewport>
          <UsersTable>
            <VisuallyHidden as="caption">Personas de la cuenta y sus permisos</VisuallyHidden>
            <TableHead>
              <tr>
                <HeaderCell scope="col">Email</HeaderCell>
                <HeaderCell scope="col">Nombre</HeaderCell>
                <HeaderCell scope="col">Rol</HeaderCell>
                <HeaderCell scope="col">Estado</HeaderCell>
                <HeaderCell scope="col">Último ingreso</HeaderCell>
                <HeaderCell $last scope="col">Acciones</HeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.email === currentEmail;

                return (
                  <UserRow key={user.email}>
                    <UserEmail scope="row">
                      {user.email}
                    </UserEmail>
                    <UserCell>{user.displayName}</UserCell>
                    <UserCell $muted>
                      {isAdmin(user) ? "Administrador" : "Usuario"}
                    </UserCell>
                    <UserCell $muted>
                      {user.status === "active" ? "Habilitado" : "Deshabilitado"}
                    </UserCell>
                    <UserCell $muted>{formatDate(user.lastLoginAt)}</UserCell>
                    <UserCell $last>
                      <ActionButton
                        disabled={isCurrentUser || busyEmail === user.email}
                        onClick={() => handleToggleStatus(user)}
                        title={isCurrentUser ? "No podés cambiar el estado de tu propia cuenta." : undefined}
                        type="button"
                      >
                        {user.status === "active" ? "Deshabilitar" : "Habilitar"}
                      </ActionButton>
                    </UserCell>
                  </UserRow>
                );
              })}
            </tbody>
          </UsersTable>
        </TableViewport>
      )}
    </AdminSection>
  );
}

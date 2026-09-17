import { useState } from "react";

import {
  ERROR_ALERT_CLASSES,
  FIELD_CLASSES,
  LABEL_CLASSES,
  LOADING_TEXT_CLASSES,
  PRIMARY_BUTTON_CLASSES,
  SECTION_DESCRIPTION_CLASSES,
  SECTION_HEADING_CLASSES,
  SUCCESS_ALERT_CLASSES,
} from "../../../app/constants/styles.consts.js";

import { useUsers } from "../hooks/useUsers.js";

const ACTION_CLASSES = "px-2.5 py-1 rounded-md border border-control text-[12px] text-text-primary hover:border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const EMPTY_FORM = { email: "", displayName: "", password: "", role: "user" };

/** Formatea una fecha ISO para la tabla, o avisa que nunca ocurrió. */
function formatDate(isoDate) {
  if (!isoDate) return "Nunca";

  return new Date(isoDate).toLocaleDateString("es-AR");
}
/** Alta de usuarios con rol elegible, sólo visible para administradores. */
function CreateUserForm({ onCreate = () => {}, submitting = false }) {
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
    <form aria-labelledby="alta-heading" className="mb-6" onSubmit={handleSubmit}>
      <h3 className="text-[13px] font-semibold text-text-primary mb-3" id="alta-heading">
        Dar de alta un usuario en el equipo
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL_CLASSES} htmlFor="alta-email">
          Email
          <input
            autoCapitalize="none"
            autoComplete="email"
            className={FIELD_CLASSES}
            id="alta-email"
            maxLength={254}
            name="email"
            onChange={updateField("email")}
            required
            spellCheck="false"
            type="email"
            value={form.email}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="alta-nombre">
          Nombre visible (opcional)
          <input
            className={FIELD_CLASSES}
            id="alta-nombre"
            maxLength={80}
            onChange={updateField("displayName")}
            type="text"
            value={form.displayName}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="alta-password">
          Contraseña inicial
          <input
            autoComplete="new-password"
            className={FIELD_CLASSES}
            id="alta-password"
            minLength={8}
            onChange={updateField("password")}
            required
            type="password"
            value={form.password}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="alta-rol">
          Rol
          <select
            className={FIELD_CLASSES}
            id="alta-rol"
            onChange={updateField("role")}
            value={form.role}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </div>

      <button
        className={`${PRIMARY_BUTTON_CLASSES} mt-3`}
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Creando..." : "Crear usuario"}
      </button>
    </form>
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
export function UserAdmin({ currentEmail = "" }) {
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
    <section aria-labelledby="usuarios-heading" className="rounded-lg border border-border bg-surface p-5">
      <h2 className={SECTION_HEADING_CLASSES} id="usuarios-heading">
        Usuarios
      </h2>
      <p className={SECTION_DESCRIPTION_CLASSES}>
        Las personas de tu cuenta. Todas ven el mismo tablero: no tienen que cargar credenciales de GitLab.
      </p>

      {actionError || error ? (
        <p className={ERROR_ALERT_CLASSES} role="alert">
          {actionError ?? error}
        </p>
      ) : null}

      {message ? (
        <p className={SUCCESS_ALERT_CLASSES} role="status">
          {message}
        </p>
      ) : null}

      <CreateUserForm onCreate={handleCreate} submitting={busyEmail !== null} />

      {loading ? (
        <p className={LOADING_TEXT_CLASSES} role="status">Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <caption className="sr-only">Personas de la cuenta y sus permisos</caption>
            <thead className="text-text-muted">
              <tr>
                <th className="py-2 pr-4 font-semibold" scope="col">Email</th>
                <th className="py-2 pr-4 font-semibold" scope="col">Nombre</th>
                <th className="py-2 pr-4 font-semibold" scope="col">Rol</th>
                <th className="py-2 pr-4 font-semibold" scope="col">Estado</th>
                <th className="py-2 pr-4 font-semibold" scope="col">Último ingreso</th>
                <th className="py-2 font-semibold" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.email === currentEmail;

                return (
                  <tr className="border-t border-border-soft" key={user.email}>
                    <th className="py-2 pr-4 font-mono font-normal text-text-primary" scope="row">
                      {user.email}
                    </th>
                    <td className="py-2 pr-4 text-text-primary">{user.displayName}</td>
                    <td className="py-2 pr-4 text-text-muted">
                      {user.role === "admin" ? "Administrador" : "Usuario"}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">
                      {user.status === "active" ? "Habilitado" : "Deshabilitado"}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">{formatDate(user.lastLoginAt)}</td>
                    <td className="py-2">
                      <button
                        className={ACTION_CLASSES}
                        disabled={isCurrentUser || busyEmail === user.email}
                        onClick={() => handleToggleStatus(user)}
                        title={isCurrentUser ? "No podés cambiar el estado de tu propia cuenta." : undefined}
                        type="button"
                      >
                        {user.status === "active" ? "Deshabilitar" : "Habilitar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

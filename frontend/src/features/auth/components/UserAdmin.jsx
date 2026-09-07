// 2. Dependencias externas.
import { useState } from 'react'

// 7. Imports relativos restantes.
import { useUsers } from '../hooks/useUsers.js'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted'
const ACTION_CLASSES = 'px-2.5 py-1 rounded-md border border-control text-[12px] text-text-primary hover:border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const EMPTY_FORM = { username: '', displayName: '', password: '', role: 'user' }

/** Formatea una fecha ISO para la tabla, o avisa que nunca ocurrió. */
function formatDate(isoDate) {
  if (!isoDate) return 'Nunca'

  return new Date(isoDate).toLocaleDateString('es-AR')
}

/** Alta de usuarios con rol elegible, sólo visible para administradores. */
function CreateUserForm({ submitting = false, onCreate = () => {} }) {
  const [form, setForm] = useState(EMPTY_FORM)

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const created = await onCreate({ ...form, username: form.username.trim(), displayName: form.displayName.trim() })
    if (created) setForm(EMPTY_FORM)
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="alta-heading" className="mb-6">
      <h3 id="alta-heading" className="text-[13px] font-semibold text-text-primary mb-3">
        Dar de alta un usuario
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL_CLASSES} htmlFor="alta-username">
          Usuario
          <input
            id="alta-username"
            type="text"
            value={form.username}
            onChange={updateField('username')}
            autoCapitalize="none"
            spellCheck="false"
            required
            minLength={3}
            maxLength={32}
            className={FIELD_CLASSES}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="alta-nombre">
          Nombre visible (opcional)
          <input
            id="alta-nombre"
            type="text"
            value={form.displayName}
            onChange={updateField('displayName')}
            maxLength={80}
            className={FIELD_CLASSES}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="alta-password">
          Contraseña inicial
          <input
            id="alta-password"
            type="password"
            value={form.password}
            onChange={updateField('password')}
            autoComplete="new-password"
            required
            minLength={8}
            className={FIELD_CLASSES}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="alta-rol">
          Rol
          <select
            id="alta-rol"
            value={form.role}
            onChange={updateField('role')}
            className={FIELD_CLASSES}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-3 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitting ? 'Creando...' : 'Crear usuario'}
      </button>
    </form>
  )
}

/**
 * Administración de usuarios: alta, habilitación y restablecimiento de
 * contraseñas. El backend valida el rol en cada ruta; esconder los controles
 * es sólo una cortesía de la interfaz.
 */
function UserAdmin({ currentUsername = '' }) {
  const { users, loading, error, createUser, setStatus, resetPassword } = useUsers()
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busyUsername, setBusyUsername] = useState(null)

  /** Ejecuta una acción sobre un usuario y presenta su resultado. */
  async function runAction(username, action, successMessage) {
    setBusyUsername(username)
    setActionError(null)
    setMessage(null)

    const failure = await action()

    setBusyUsername(null)
    if (failure) {
      setActionError(failure)
      return false
    }

    setMessage(successMessage)
    return true
  }

  async function handleCreate(user) {
    return await runAction(
      user.username,
      () => createUser(user),
      `Usuario «${user.username}» creado.`,
    )
  }

  function handleToggleStatus(user) {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active'

    return runAction(
      user.username,
      () => setStatus(user.username, nextStatus),
      nextStatus === 'disabled'
        ? `Usuario «${user.username}» deshabilitado.`
        : `Usuario «${user.username}» habilitado.`,
    )
  }

  function handleResetPassword(user) {
    // `prompt` alcanza para una acción de administración puntual y evita
    // sostener el estado de un formulario por fila.
    const password = window.prompt(`Contraseña nueva para «${user.username}» (mínimo 8 caracteres):`)
    if (!password) return

    runAction(
      user.username,
      () => resetPassword(user.username, password),
      `Contraseña de «${user.username}» restablecida. Se cerraron sus sesiones.`,
    )
  }

  return (
    <section aria-labelledby="usuarios-heading" className="rounded-lg border border-border bg-surface p-5">
      <h2 id="usuarios-heading" className="text-base font-semibold text-text-primary mb-4">
        Usuarios
      </h2>

      {actionError || error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {actionError ?? error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {message}
        </p>
      ) : null}

      <CreateUserForm submitting={busyUsername !== null} onCreate={handleCreate} />

      {loading ? (
        <p role="status" className="text-[13px] text-text-muted">Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <caption className="sr-only">Usuarios del tablero y sus permisos</caption>
            <thead className="text-text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">Usuario</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Nombre</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Rol</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Estado</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Último ingreso</th>
                <th scope="col" className="py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.username === currentUsername

                return (
                  <tr key={user.username} className="border-t border-border-soft">
                    <th scope="row" className="py-2 pr-4 font-mono font-normal text-text-primary">
                      @{user.username}
                    </th>
                    <td className="py-2 pr-4 text-text-primary">{user.displayName}</td>
                    <td className="py-2 pr-4 text-text-muted">
                      {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">
                      {user.status === 'active' ? 'Habilitado' : 'Deshabilitado'}
                    </td>
                    <td className="py-2 pr-4 text-text-muted">{formatDate(user.lastLoginAt)}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrentUser || busyUsername === user.username}
                          title={isCurrentUser ? 'No podés cambiar el estado de tu propia cuenta.' : undefined}
                          className={ACTION_CLASSES}
                        >
                          {user.status === 'active' ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          disabled={busyUsername === user.username}
                          className={ACTION_CLASSES}
                        >
                          Restablecer contraseña
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default UserAdmin

// 2. Dependencias externas.
import { useState } from 'react'

// 6. Imports relativos restantes.
import { useUsers } from '../hooks/useUsers.js'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted'
const ACTION_CLASSES = 'px-2.5 py-1 rounded-md border border-control text-[12px] text-text-primary hover:border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const EMPTY_FORM = { email: '', displayName: '', password: '', role: 'user' }

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

    const created = await onCreate({ ...form, email: form.email.trim(), displayName: form.displayName.trim() })
    if (created) setForm(EMPTY_FORM)
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="alta-heading" className="mb-6">
      <h3 id="alta-heading" className="text-[13px] font-semibold text-text-primary mb-3">
        Dar de alta un usuario en el equipo
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={LABEL_CLASSES} htmlFor="alta-email">
          Email
          <input
            id="alta-email"
            type="email"
            name="email"
            value={form.email}
            onChange={updateField('email')}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck="false"
            required
            maxLength={254}
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
 * Administración de usuarios: alta, habilitación y deshabilitación.
 *
 * Alcanza sólo a la cuenta de quien administra: quien se da de alta acá ve el
 * mismo tablero, con los proyectos y el token que ya están cargados. El backend
 * valida el rol y la cuenta en cada ruta; esconder los controles es sólo una
 * cortesía de la interfaz.
 */
function UserAdmin({ currentEmail = '' }) {
  const { users, loading, error, createUser, setStatus } = useUsers()
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busyEmail, setBusyEmail] = useState(null)

  /** Ejecuta una acción sobre un usuario y presenta su resultado. */
  async function runAction(email, action, successMessage) {
    setBusyEmail(email)
    setActionError(null)
    setMessage(null)

    const failure = await action()

    setBusyEmail(null)
    if (failure) {
      setActionError(failure)
      return false
    }

    setMessage(successMessage)
    return true
  }

  async function handleCreate(user) {
    return await runAction(
      user.email,
      () => createUser(user),
      `Usuario «${user.email}» creado.`,
    )
  }

  function handleToggleStatus(user) {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active'

    return runAction(
      user.email,
      () => setStatus(user.email, nextStatus),
      nextStatus === 'disabled'
        ? `Usuario «${user.email}» deshabilitado.`
        : `Usuario «${user.email}» habilitado.`,
    )
  }

  return (
    <section aria-labelledby="usuarios-heading" className="rounded-lg border border-border bg-surface p-5">
      <h2 id="usuarios-heading" className="text-base font-semibold text-text-primary mb-1">
        Usuarios
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        Las personas de tu cuenta. Todas ven el mismo tablero: no tienen que cargar credenciales de GitLab.
      </p>

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

      <CreateUserForm submitting={busyEmail !== null} onCreate={handleCreate} />

      {loading ? (
        <p role="status" className="text-[13px] text-text-muted">Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <caption className="sr-only">Personas de la cuenta y sus permisos</caption>
            <thead className="text-text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">Email</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Nombre</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Rol</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Estado</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Último ingreso</th>
                <th scope="col" className="py-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isCurrentUser = user.email === currentEmail

                return (
                  <tr key={user.email} className="border-t border-border-soft">
                    <th scope="row" className="py-2 pr-4 font-mono font-normal text-text-primary">
                      {user.email}
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
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        disabled={isCurrentUser || busyEmail === user.email}
                        title={isCurrentUser ? 'No podés cambiar el estado de tu propia cuenta.' : undefined}
                        className={ACTION_CLASSES}
                      >
                        {user.status === 'active' ? 'Deshabilitar' : 'Habilitar'}
                      </button>
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

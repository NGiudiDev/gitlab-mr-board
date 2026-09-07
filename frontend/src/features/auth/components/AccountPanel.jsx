// 2. Dependencias externas.
import { useState } from 'react'

// 7. Imports relativos restantes.
import UserAdmin from './UserAdmin.jsx'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted mb-3'

/** Cambio de la propia contraseña, pidiendo la actual como confirmación. */
function OwnPasswordForm({ submitting = false, onSubmit = () => {} }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()

    if (newPassword !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setError(null)
    setError(await onSubmit({ currentPassword, newPassword }))
  }

  return (
    <section aria-labelledby="contrasena-heading" className="mb-6 rounded-lg border border-border bg-surface p-5">
      <h2 id="contrasena-heading" className="text-base font-semibold text-text-primary mb-1">
        Mi contraseña
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        Al cambiarla se cierran todas tus sesiones, así que vas a tener que ingresar de nuevo.
      </p>

      {error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="max-w-sm">
        <label className={LABEL_CLASSES} htmlFor="cuenta-actual">
          Contraseña actual
          <input
            id="cuenta-actual"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={FIELD_CLASSES}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="cuenta-nueva">
          Contraseña nueva
          <input
            id="cuenta-nueva"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className={FIELD_CLASSES}
          />
        </label>

        <label className={LABEL_CLASSES} htmlFor="cuenta-confirmacion">
          Repetí la contraseña nueva
          <input
            id="cuenta-confirmacion"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className={FIELD_CLASSES}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {submitting ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  )
}

/**
 * Pantalla de cuenta: la contraseña propia para cualquiera, y la
 * administración de usuarios para quien tenga rol de administrador.
 */
function AccountPanel({ user = null, submitting = false, onChangePassword = () => {} }) {
  if (!user) return null

  return (
    <>
      <OwnPasswordForm submitting={submitting} onSubmit={onChangePassword} />
      {user.role === 'admin' ? <UserAdmin currentUsername={user.username} /> : null}
    </>
  )
}

export default AccountPanel

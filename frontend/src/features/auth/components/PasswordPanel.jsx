// 2. Dependencias externas.
import { useState } from 'react'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted mb-3'

/**
 * Cambio de la propia contraseña, pidiendo la actual como confirmación.
 *
 * Es una de las tarjetas de «Mi perfil»; los datos compartidos de la cuenta y
 * la administración de usuarios son sus propios componentes.
 *
 * El estado de las contraseñas es local: sólo lo necesita esta pantalla y no
 * debe sobrevivir al envío.
 */
function PasswordPanel({ user = null, submitting = false, onChangePassword = () => {} }) {
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
    setError(await onChangePassword({ currentPassword, newPassword }))
  }

  if (!user) return null

  return (
    <section aria-labelledby="contrasena-heading">
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

      <form onSubmit={handleSubmit}>
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

export default PasswordPanel

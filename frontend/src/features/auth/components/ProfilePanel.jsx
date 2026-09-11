// 2. Dependencias externas.
import { useEffect, useState } from 'react'

/**
 * Permite editar el nombre visible y el identificador de la propia persona.
 */
function ProfilePanel({
  user = null,
  submitting = false,
  onSave = async () => null,
}) {
  const [profile, setProfile] = useState({ displayName: '', username: '' })
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setProfile({
      displayName: user?.displayName ?? '',
      username: user?.username ?? '',
    })
  }, [user?.displayName, user?.username])

  if (!user) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    const failure = await onSave({
      displayName: profile.displayName.trim(),
      username: profile.username.trim(),
    })

    if (failure) {
      setError(failure)
      return
    }

    setNotice('Perfil actualizado.')
  }

  return (
    <section aria-labelledby="perfil-heading" className="max-w-xl rounded-lg border border-border bg-surface p-5">
      <h2 id="perfil-heading" className="mb-1 text-base font-semibold text-text-primary">
        Mi perfil
      </h2>
      <p className="mb-4 text-[12.5px] text-text-muted">
        Estos datos identifican tu sesión. Si cambiás el nombre de usuario, usá el nuevo la próxima vez que ingreses.
      </p>

      <form className="max-w-sm" onSubmit={handleSubmit}>
        <label className="mb-3 block text-[12px] font-semibold text-text-muted" htmlFor="perfil-display-name">
          Nombre visible
          <input
            id="perfil-display-name"
            type="text"
            name="displayName"
            autoComplete="name"
            value={profile.displayName}
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            disabled={submitting}
            className="mt-1 block w-full rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </label>

        <label className="mb-1 block text-[12px] font-semibold text-text-muted" htmlFor="perfil-username">
          Nombre de usuario
          <input
            id="perfil-username"
            type="text"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9._-]{3,32}"
            required
            value={profile.username}
            onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value }))}
            disabled={submitting}
            aria-describedby="perfil-username-ayuda"
            className="mt-1 block w-full rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </label>
        <p id="perfil-username-ayuda" className="text-[11px] text-text-faint">
          Entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.
        </p>

        {error ? <p role="alert" className="mt-3 text-xs text-conflict">{error}</p> : null}
        {notice ? <p role="status" className="mt-3 text-xs text-ready">{notice}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {submitting ? 'Guardando…' : 'Guardar perfil'}
        </button>
      </form>
    </section>
  )
}

export default ProfilePanel

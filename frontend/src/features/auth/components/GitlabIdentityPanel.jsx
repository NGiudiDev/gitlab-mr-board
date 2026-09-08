// 2. Dependencias externas.
import { useEffect, useState } from 'react'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted'
const HINT_CLASSES = 'mt-1 text-[12px] font-normal text-text-faint'

/**
 * Nickname de GitLab de la propia persona.
 *
 * Es lo único de GitLab que carga cada uno: el token y los proyectos son de la
 * cuenta, pero con qué nombre aparece cada persona en los merge requests es
 * suyo, y de eso depende la vista personal.
 */
function GitlabIdentityPanel({ user = null, submitting = false, onSave = () => {} }) {
  const [gitlabUsername, setGitlabUsername] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // La sesión puede llegar después del primer render, y también cambia al
  // guardar: el campo sigue a lo que dice el backend.
  useEffect(() => {
    setGitlabUsername(user?.gitlabUsername ?? '')
  }, [user?.gitlabUsername])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const failure = await onSave(gitlabUsername.trim())

    if (failure) {
      setError(failure)
      return
    }

    setMessage('Nickname de GitLab guardado.')
  }

  if (!user) return null

  return (
    <section aria-labelledby="identidad-heading" className="max-w-xl rounded-lg border border-border bg-surface p-5">
      <h2 id="identidad-heading" className="text-base font-semibold text-text-primary mb-1">
        Mi identidad en GitLab
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        Con tu nickname el tablero reconoce cuáles de los merge requests del equipo son tuyos.
      </p>

      {error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {message}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="max-w-sm">
        {/* La ayuda queda fuera del `label` para que no forme parte del nombre
            accesible del campo; `aria-describedby` la asocia igual. */}
        <div className="mb-4">
          <label className={LABEL_CLASSES} htmlFor="identidad-nickname">
            Nickname de GitLab
          </label>
          <input
            id="identidad-nickname"
            type="text"
            value={gitlabUsername}
            onChange={(event) => setGitlabUsername(event.target.value)}
            autoCapitalize="none"
            spellCheck="false"
            required
            aria-describedby="identidad-nickname-ayuda"
            className={FIELD_CLASSES}
          />
          <p id="identidad-nickname-ayuda" className={HINT_CLASSES}>
            Tu nombre de usuario en GitLab, sin la arroba.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {submitting ? 'Guardando...' : 'Guardar mi nickname'}
        </button>
      </form>
    </section>
  )
}

export default GitlabIdentityPanel

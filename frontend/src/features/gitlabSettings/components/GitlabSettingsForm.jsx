// 2. Dependencias externas.
import { useEffect, useState } from 'react'

// 7. Imports relativos restantes.
import { useGitlabSettings } from '../hooks/useGitlabSettings.js'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted'
const HINT_CLASSES = 'mt-1 text-[12px] font-normal text-text-faint'

/**
 * Configuración de GitLab que alimenta el tablero: los IDs de los proyectos y
 * el access token con el que se los consulta.
 *
 * El token es de cada persona y el backend lo guarda cifrado, así que nunca
 * vuelve al navegador: el campo arranca vacío y sólo se envía si se escribe
 * uno nuevo.
 */
function GitlabSettingsForm({ onSaved = () => {} }) {
  const { settings, loading, error, saving, save } = useGitlabSettings()
  const [projectIds, setProjectIds] = useState('')
  const [gitlabUsername, setGitlabUsername] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [formError, setFormError] = useState(null)
  const [message, setMessage] = useState(null)

  // La configuración llega después del primer render, así que los campos se
  // completan recién cuando el backend responde.
  useEffect(() => {
    setProjectIds(settings?.projectIds.join(', ') ?? '')
    setGitlabUsername(settings?.gitlabUsername ?? '')
  }, [settings])

  const hasStoredToken = Boolean(settings?.tokenHint)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setMessage(null)

    const failure = await save({ projectIds, gitlabUsername, accessToken: accessToken.trim() })

    if (failure) {
      setFormError(failure)
      return
    }

    // El token guardado no se recupera, así que el campo vuelve a quedar vacío.
    setAccessToken('')
    setMessage('Configuración de GitLab guardada.')
    onSaved()
  }

  return (
    <section aria-labelledby="gitlab-heading" className="max-w-xl rounded-lg border border-border bg-surface p-5">
      <h2 id="gitlab-heading" className="text-base font-semibold text-text-primary mb-1">
        GitLab
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        El tablero muestra los merge requests de estos proyectos, consultados con tu propio access token.
      </p>

      {formError || error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {formError ?? error}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p role="status" className="text-[13px] text-text-muted">Cargando la configuración...</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-sm">
          {/* La ayuda queda fuera del `label` para que no forme parte del
              nombre accesible del campo; `aria-describedby` la asocia igual. */}
          <div className="mb-4">
            <label className={LABEL_CLASSES} htmlFor="gitlab-proyectos">
              IDs de los proyectos
            </label>
            <input
              id="gitlab-proyectos"
              type="text"
              value={projectIds}
              onChange={(event) => setProjectIds(event.target.value)}
              inputMode="numeric"
              spellCheck="false"
              required
              aria-describedby="gitlab-proyectos-ayuda"
              className={FIELD_CLASSES}
            />
            <p id="gitlab-proyectos-ayuda" className={HINT_CLASSES}>
              Números separados por comas, por ejemplo 123, 456. Los encontrás en la portada de cada proyecto en GitLab.
            </p>
          </div>

          <div className="mb-4">
            <label className={LABEL_CLASSES} htmlFor="gitlab-nickname">
              Nickname de GitLab
            </label>
            <input
              id="gitlab-nickname"
              type="text"
              value={gitlabUsername}
              onChange={(event) => setGitlabUsername(event.target.value)}
              autoCapitalize="none"
              spellCheck="false"
              required
              aria-describedby="gitlab-nickname-ayuda"
              className={FIELD_CLASSES}
            />
            <p id="gitlab-nickname-ayuda" className={HINT_CLASSES}>
              Tu nombre de usuario en GitLab, sin la arroba. Con él la vista personal sabe cuáles son tus tareas.
            </p>
          </div>

          <div className="mb-4">
            <label className={LABEL_CLASSES} htmlFor="gitlab-token">
              Access token
            </label>
            <input
              id="gitlab-token"
              type="password"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              autoComplete="off"
              spellCheck="false"
              required={!hasStoredToken}
              aria-describedby="gitlab-token-ayuda"
              className={FIELD_CLASSES}
            />
            <p id="gitlab-token-ayuda" className={HINT_CLASSES}>
              {hasStoredToken
                ? `Ya hay uno guardado, terminado en «${settings.tokenHint}». Dejá el campo vacío para conservarlo.`
                : 'PAT de GitLab con el alcance read_api. Se guarda cifrado y no se muestra nunca más.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      )}
    </section>
  )
}

export default GitlabSettingsForm

// 2. Dependencias externas.
import { useEffect, useState } from 'react'

// 7. Imports relativos restantes.
import { useGitlabSettings } from '../hooks/useGitlabSettings.js'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted'
const HINT_CLASSES = 'mt-1 text-[12px] font-normal text-text-faint'

/**
 * Estado de la configuración para quien no administra la cuenta.
 *
 * Es informativo a propósito: no puede cambiarla —el backend responde 403—,
 * pero sí necesita saber si el tablero ya tiene de dónde alimentarse y a quién
 * pedirle el cambio.
 */
function SettingsSummary({ settings = null }) {
  if (!settings) {
    return (
      <p role="status" className="text-[13px] text-text-muted">
        Todavía no hay proyectos ni access token cargados. Pedíselo a quien administra la cuenta.
      </p>
    )
  }

  return (
    <dl className="text-[13px]">
      <dt className={LABEL_CLASSES}>Proyectos</dt>
      <dd className="mb-3 mt-1 font-mono text-text-primary">{settings.projectIds.join(', ')}</dd>
      <dt className={LABEL_CLASSES}>Access token</dt>
      <dd className="mt-1 text-text-primary">
        Guardado, terminado en «{settings.tokenHint}».
      </dd>
    </dl>
  )
}

/**
 * Configuración de GitLab que alimenta el tablero de la cuenta: los IDs de los
 * proyectos y el access token con el que se los consulta.
 *
 * Es de la cuenta y no de cada persona: la carga un administrador una sola vez
 * y con ella se arma el tablero de todo el equipo. El token se guarda cifrado
 * y nunca vuelve al navegador, así que el campo arranca vacío y sólo se envía
 * si se escribe uno nuevo.
 */
function GitlabSettingsForm({ canEdit = false, onSaved = () => {} }) {
  const { settings, loading, error, saving, save } = useGitlabSettings()
  const [projectIds, setProjectIds] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [formError, setFormError] = useState(null)
  const [message, setMessage] = useState(null)

  // La configuración llega después del primer render, así que los campos se
  // completan recién cuando el backend responde.
  useEffect(() => {
    setProjectIds(settings?.projectIds.join(', ') ?? '')
  }, [settings])

  const hasStoredToken = Boolean(settings?.tokenHint)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setMessage(null)

    const failure = await save({ projectIds, accessToken: accessToken.trim() })

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
        GitLab de la cuenta
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        {canEdit
          ? 'El tablero muestra los merge requests de estos proyectos. Los cargás una vez y los ve todo el equipo.'
          : 'El tablero se alimenta de estos proyectos. Los carga quien administra la cuenta, así que no tenés que cargar tu propio access token.'}
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
      ) : !canEdit ? (
        <SettingsSummary settings={settings} />
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

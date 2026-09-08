// 2. Dependencias externas.
import { useState } from 'react'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted mb-3'
const CHOICE_CLASSES = 'flex-1 rounded-md border px-3 py-2 text-[12.5px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const MINIMUM_PASSWORD_LENGTH = 8

/**
 * Formulario de alta de cuenta.
 *
 * Hay dos caminos y son excluyentes: sumarse a una cuenta que ya existe con su
 * código de invitación, o abrir una cuenta nueva y quedar su administrador.
 * Quien se suma no configura nada de GitLab: eso ya está en la cuenta.
 *
 * Valida en el navegador lo mismo que el backend para avisar antes de enviar,
 * pero la regla que manda es la del backend.
 */
function RegisterForm({ error = null, submitting = false, onSubmit = () => {}, onShowLogin = () => {} }) {
  const [joinExisting, setJoinExisting] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [localError, setLocalError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()

    if (password !== confirmation) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }

    setLocalError(null)
    onSubmit({
      username: username.trim(),
      password,
      displayName: displayName.trim(),
      // Sólo viaja el dato del camino elegido: con código el backend ignora el
      // nombre, y sin código no hay cuenta a la que sumarse.
      ...(joinExisting ? { inviteCode: inviteCode.trim() } : { accountName: accountName.trim() }),
    })
  }

  const visibleError = localError ?? error

  /** Clases del botón que elige el camino, según esté activo o no. */
  function choiceClasses(isActive) {
    return `${CHOICE_CLASSES} ${isActive
      ? 'border-accent bg-surface-raised font-semibold text-text-primary'
      : 'border-control text-text-muted hover:text-text-primary'}`
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="registro-heading"
      className="w-full max-w-sm mx-auto mt-16 rounded-lg border border-border bg-surface p-6"
    >
      <h1 id="registro-heading" className="text-lg font-semibold text-text-primary mb-1">
        Crear una cuenta
      </h1>
      <p className="text-[12.5px] text-text-muted mb-5">
        Elegí un usuario y una contraseña de al menos {MINIMUM_PASSWORD_LENGTH} caracteres.
      </p>

      {visibleError ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {visibleError}
        </p>
      ) : null}

      <fieldset className="mb-4">
        <legend className="text-[12px] font-semibold text-text-muted mb-2">
          ¿Cómo querés entrar?
        </legend>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={joinExisting}
            onClick={() => setJoinExisting(true)}
            className={choiceClasses(joinExisting)}
          >
            Sumarme a un equipo
          </button>
          <button
            type="button"
            aria-pressed={!joinExisting}
            onClick={() => setJoinExisting(false)}
            className={choiceClasses(!joinExisting)}
          >
            Crear un equipo
          </button>
        </div>
      </fieldset>

      {joinExisting ? (
        <>
          <label className={LABEL_CLASSES} htmlFor="registro-invitacion">
            Código de invitación
            <input
              id="registro-invitacion"
              name="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              autoCapitalize="characters"
              spellCheck="false"
              required
              aria-describedby="registro-invitacion-ayuda"
              className={FIELD_CLASSES}
            />
          </label>
          <p id="registro-invitacion-ayuda" className="-mt-2 mb-3 text-[11.5px] font-normal text-text-faint">
            Te lo da quien administra el tablero de tu equipo. Con él ves los mismos proyectos, sin cargar credenciales de GitLab.
          </p>
        </>
      ) : (
        <>
          <label className={LABEL_CLASSES} htmlFor="registro-cuenta">
            Nombre del equipo (opcional)
            <input
              id="registro-cuenta"
              name="accountName"
              type="text"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              maxLength={80}
              aria-describedby="registro-cuenta-ayuda"
              className={FIELD_CLASSES}
            />
          </label>
          <p id="registro-cuenta-ayuda" className="-mt-2 mb-3 text-[11.5px] font-normal text-text-faint">
            Vas a quedar administrador: cargás una vez los proyectos y el access token de GitLab, y el resto del equipo se suma con un código.
          </p>
        </>
      )}

      <label className={LABEL_CLASSES} htmlFor="registro-username">
        Usuario
        <input
          id="registro-username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          required
          minLength={3}
          maxLength={32}
          pattern="[A-Za-z0-9._\-]+"
          aria-describedby="registro-username-ayuda"
          className={FIELD_CLASSES}
        />
      </label>
      <p id="registro-username-ayuda" className="-mt-2 mb-3 text-[11.5px] font-normal text-text-faint">
        Entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.
      </p>

      <label className={LABEL_CLASSES} htmlFor="registro-nombre">
        Nombre visible (opcional)
        <input
          id="registro-nombre"
          name="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          maxLength={80}
          className={FIELD_CLASSES}
        />
      </label>

      <label className={LABEL_CLASSES} htmlFor="registro-password">
        Contraseña
        <input
          id="registro-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={MINIMUM_PASSWORD_LENGTH}
          className={FIELD_CLASSES}
        />
      </label>

      <label className={LABEL_CLASSES} htmlFor="registro-confirmacion">
        Repetí la contraseña
        <input
          id="registro-confirmacion"
          name="passwordConfirmation"
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          required
          minLength={MINIMUM_PASSWORD_LENGTH}
          className={FIELD_CLASSES}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-2 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitting ? 'Creando la cuenta...' : 'Crear cuenta'}
      </button>

      <p className="mt-4 text-center text-[12.5px] text-text-muted">
        ¿Ya tenés cuenta?{' '}
        <button
          type="button"
          onClick={onShowLogin}
          className="text-accent underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ingresar
        </button>
      </p>
    </form>
  )
}

export default RegisterForm

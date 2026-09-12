// 2. Dependencias externas.
import { useState } from 'react'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted mb-3'

/**
 * Formulario de ingreso al tablero.
 *
 * El estado de las credenciales es local: sólo lo necesita este componente y
 * no debe sobrevivir al envío.
 */
function LoginForm({
  error = null,
  notice = null,
  submitting = false,
  onSubmit = () => {},
  onShowRegister = () => {},
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ email: email.trim(), password })
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="login-heading"
      className="w-full max-w-sm mx-auto mt-16 rounded-lg border border-border bg-surface p-6"
    >
      <h1 id="login-heading" className="text-lg font-semibold text-text-primary mb-1">
        Tablero de MRs
      </h1>
      <p className="text-[12.5px] text-text-muted mb-5">Ingresá con tu email para ver el tablero.</p>

      {error ? (
        <p role="alert" className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p role="status" className="mb-4 rounded-md border border-ready bg-ready-soft px-3 py-2 text-[12.5px] text-text-primary">
          {notice}
        </p>
      ) : null}

      <label className={LABEL_CLASSES} htmlFor="login-email">
        Email
        <input
          id="login-email"
          name="email"
          type="text"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck="false"
          required
          className={FIELD_CLASSES}
        />
      </label>

      <label className={LABEL_CLASSES} htmlFor="login-password">
        Contraseña
        <input
          id="login-password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className={FIELD_CLASSES}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-2 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitting ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p className="mt-4 text-center text-[12.5px] text-text-muted">
        ¿No tenés cuenta?{' '}
        <button
          type="button"
          onClick={onShowRegister}
          className="text-accent underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Crear una cuenta
        </button>
      </p>
    </form>
  )
}

export default LoginForm

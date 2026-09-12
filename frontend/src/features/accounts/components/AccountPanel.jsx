// 2. Dependencias externas.
import { useEffect, useState } from 'react'

// 6. Imports relativos restantes.
import { useAccount } from '../hooks/useAccount.js'

const FIELD_CLASSES = 'block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const LABEL_CLASSES = 'block text-[12px] font-semibold text-text-muted'
const HINT_CLASSES = 'mt-1 text-[12px] font-normal text-text-faint'
const BUTTON_CLASSES = 'rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const SECONDARY_BUTTON_CLASSES = 'rounded-md border border-control px-3 py-2 text-[12.5px] text-text-primary hover:border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** Describe la cantidad de miembros sin dejar el número suelto. */
function membersLabel(memberCount) {
  return memberCount === 1 ? '1 persona' : `${memberCount} personas`
}

/**
 * Invitación al equipo: el código con el que alguien se suma a la cuenta.
 *
 * Sólo se muestra a un administrador, porque tener el código alcanza para
 * entrar a ver el tablero.
 */
function InviteCode({ inviteCode = '', submitting = false, onRotate = () => {} }) {
  return (
    <div className="mt-5 border-t border-border-soft pt-4">
      <h3 className="text-[13px] font-semibold text-text-primary mb-1">
        Invitar al equipo
      </h3>
      
      <p className="text-[12.5px] text-text-muted mb-3">
        Quien se registre con este código entra a esta cuenta y ve el mismo tablero, sin cargar ninguna credencial de GitLab.
      </p>

      {/* El código va en un campo de sólo lectura y no en un párrafo: así se
          selecciona y se copia de una, y el `label` le da nombre accesible. */}
      <div className="mb-3">
        <label className={LABEL_CLASSES} htmlFor="cuenta-invitacion">
          Código de invitación
        </label>

        <input
          id="cuenta-invitacion"
          type="text"
          value={inviteCode}
          readOnly
          className={`${FIELD_CLASSES} font-mono tracking-widest`}
        />
      </div>

      <button
        type="button"
        onClick={onRotate}
        disabled={submitting}
        className={SECONDARY_BUTTON_CLASSES}
      >
        {submitting ? 'Renovando...' : 'Renovar el código'}
      </button>

      <p className={HINT_CLASSES}>
        Al renovarlo, el código anterior deja de servir. Quien ya se sumó no pierde el acceso.
      </p>
    </div>
  )
}

/**
 * Datos de la cuenta que comparte el tablero: su nombre, cuánta gente la
 * integra y —para quien administra— el código con el que se suma el resto.
 *
 * El nombre lo edita sólo un administrador; el backend valida el rol.
 */
function AccountPanel({ user = null }) {
  const { account, loading, error, submitting, renameAccount, rotateInviteCode } = useAccount(user?.accountId ?? null)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState(null)
  const [message, setMessage] = useState(null)

  // La cuenta llega después del primer render, así que el campo se completa
  // recién cuando el backend responde.
  useEffect(() => {
    setName(account?.name ?? '')
  }, [account])

  const isAdmin = user?.role === 'admin'

  /** Ejecuta una acción sobre la cuenta y presenta su resultado. */
  async function runAction(action, successMessage) {
    setFormError(null)
    setMessage(null)

    const failure = await action()

    if (failure) {
      setFormError(failure)
      return
    }

    setMessage(successMessage)
  }

  function handleSubmit(event) {
    event.preventDefault()

    return runAction(() => renameAccount(name), 'Nombre de la cuenta actualizado.')
  }

  if (!user) return null

  return (
    <section aria-labelledby="cuenta-heading">
      <h2 id="cuenta-heading" className="text-base font-semibold text-text-primary mb-1">
        Mi equipo
      </h2>
      <p className="text-[12.5px] text-text-muted mb-4">
        La cuenta agrupa a las personas que ven el mismo tablero, con los mismos proyectos y el mismo access token de GitLab.
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

      {loading && !account ? (
        <p role="status" className="text-[13px] text-text-muted">Cargando la cuenta...</p>
      ) : !account ? null : (
        <>
          {isAdmin ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={LABEL_CLASSES} htmlFor="cuenta-nombre">
                  Nombre de la cuenta
                </label>
                <input
                  id="cuenta-nombre"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                  aria-describedby="cuenta-nombre-ayuda"
                  className={FIELD_CLASSES}
                />
                <p id="cuenta-nombre-ayuda" className={HINT_CLASSES}>
                  La integran {membersLabel(account.memberCount)}.
                </p>
              </div>

              <button type="submit" disabled={submitting} className={BUTTON_CLASSES}>
                {submitting ? 'Guardando...' : 'Guardar el nombre'}
              </button>
            </form>
          ) : (
            <dl className="text-[13px]">
              <dt className={LABEL_CLASSES}>Cuenta</dt>
              <dd className="mb-3 mt-1 text-text-primary">{account.name}</dd>
              <dt className={LABEL_CLASSES}>Integrantes</dt>
              <dd className="mt-1 text-text-primary">{membersLabel(account.memberCount)}</dd>
            </dl>
          )}

          {isAdmin && account.inviteCode ? (
            <InviteCode
              inviteCode={account.inviteCode}
              submitting={submitting}
              onRotate={() => runAction(rotateInviteCode, 'Código de invitación renovado.')}
            />
          ) : null}
        </>
      )}
    </section>
  )
}

export default AccountPanel

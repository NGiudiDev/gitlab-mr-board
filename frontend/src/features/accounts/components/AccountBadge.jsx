// 6. Imports relativos restantes.
import { useAccount } from '../hooks/useAccount.js'

/**
 * Nombre de la cuenta cuyo tablero se está mirando.
 *
 * Vive en la barra superior porque el tablero es de la cuenta y no de la
 * persona: saber de qué equipo son los merge requests que se ven es parte de
 * entender lo que hay en pantalla.
 */
function AccountBadge({ user = null }) {
  const { account } = useAccount(user?.accountId ?? null)

  if (!account) return null

  return (
    <p className="text-[12px] text-text-muted">
      Equipo <span className="font-semibold text-text-primary">{account.name}</span>
    </p>
  )
}

export default AccountBadge

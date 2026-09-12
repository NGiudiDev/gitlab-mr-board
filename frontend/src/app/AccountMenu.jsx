// 2. Dependencias externas.
import { useEffect, useId, useRef, useState } from 'react'

// 6. Imports relativos restantes.
import { useAccount } from '../features/accounts/hooks/useAccount.js'

/**
 * Obtiene hasta dos iniciales para representar a la persona sin una imagen.
 *
 * @param {{ displayName?: string, email?: string } | null} user Usuario de la sesión.
 * @returns {string} Iniciales en mayúsculas.
 */
function initialsFor(user) {
  const label = user?.displayName?.trim() || user?.email?.trim() || '?'
  const words = label.split(/\s+/)
  const initials = words.length > 1
    ? `${words[0][0]}${words.at(-1)[0]}`
    : label.slice(0, 2)

  return initials.toLocaleUpperCase('es')
}

/**
 * Reúne la identidad, los accesos al perfil y la cuenta, y el cierre de sesión.
 */
function AccountMenu({
  user = null,
  onEditAccount = () => {},
  onEditProfile = () => {},
  onLogout = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const { account, loading } = useAccount(user?.accountId ?? null)

  function closeMenu() {
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) closeMenu()
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return

      closeMenu()
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!user) return null

  function handleLogout() {
    closeMenu()
    onLogout()
  }

  function openProfileScreen() {
    closeMenu()
    onEditProfile()
  }

  function openAccountScreen() {
    closeMenu()
    onEditAccount()
  }

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${isOpen ? 'Cerrar' : 'Abrir'} menú de cuenta de ${user.displayName}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => {
          if (isOpen) {
            closeMenu()
            return
          }

          setIsOpen(true)
        }}
        className="flex min-h-10 items-center gap-1.5 rounded-full border border-control bg-surface px-1.5 py-1 text-text-primary hover:border-accent hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-bg"
          aria-hidden="true"
        >
          {initialsFor(user)}
        </span>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="region"
          aria-label="Menú de cuenta"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-accent text-sm font-bold text-bg"
              aria-hidden="true"
            >
              {initialsFor(user)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{user.displayName}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
            </div>
          </div>

          <dl className="border-y border-border-soft px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Equipo</dt>
            <dd className="mt-0.5 truncate text-sm text-text-primary">
              {account?.name ?? (loading ? 'Cargando…' : 'No disponible')}
            </dd>
          </dl>

          <div className="p-2">
            <button
              type="button"
              onClick={openProfileScreen}
              className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg
                className="h-4 w-4 text-text-muted"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="m13.5 3.5 3 3L7 16H4v-3L13.5 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Editar perfil
            </button>
            <button
              type="button"
              onClick={openAccountScreen}
              className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg
                className="h-4 w-4 text-text-muted"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M3.5 16.5h13M5 16.5v-9h10v9M7.5 10h1m3 0h1m-5 3h1m3 0h1M4 7.5 10 3l6 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {user.role === 'admin' ? 'Editar cuenta' : 'Ver cuenta'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg
                className="h-4 w-4 text-text-muted"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 6.5 16 10l-3.5 3.5M7 10h9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { initialsFor }
export default AccountMenu

const BUTTON_CLASSES = 'px-2.5 py-1 rounded-md border border-control text-text-primary hover:border-accent cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Muestra quién tiene la sesión abierta, permite ir a la pantalla de cuenta y
 * cerrar la sesión.
 *
 * Va sobre la barra del tablero para que la identidad esté siempre visible,
 * requisito de la vista personal.
 */
function SessionBar({ user = null, view = 'board', onChangeView = () => {}, onLogout = () => {} }) {
  if (!user) return null

  const showingBoard = view === 'board'

  return (
    <div className="flex items-center justify-end gap-3 mb-2 text-[12px] text-text-muted">
      <span>
        Sesión de <span className="text-text-primary font-semibold">{user.displayName}</span>
        {' '}
        <span className="font-mono">(@{user.username})</span>
      </span>
      <button
        type="button"
        onClick={() => onChangeView(showingBoard ? 'account' : 'board')}
        className={BUTTON_CLASSES}
      >
        {showingBoard ? 'Mi cuenta' : 'Volver al tablero'}
      </button>
      <button type="button" onClick={onLogout} className={BUTTON_CLASSES}>
        Cerrar sesión
      </button>
    </div>
  )
}

export default SessionBar

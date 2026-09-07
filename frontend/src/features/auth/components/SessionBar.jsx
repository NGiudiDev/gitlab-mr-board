/**
 * Muestra quién tiene la sesión abierta y permite cerrarla.
 *
 * Vive en la barra superior del layout para que la identidad esté siempre
 * visible, requisito de la vista personal. La navegación entre secciones es
 * responsabilidad de `AppShell`.
 */
function SessionBar({ user = null, onLogout = () => {} }) {
  if (!user) return null

  return (
    <div className="flex items-center gap-3 text-[12px] text-text-muted">
      <span>
        Sesión de <span className="text-text-primary font-semibold">{user.displayName}</span>
        {' '}
        <span className="font-mono">(@{user.username})</span>
      </span>
      <button
        type="button"
        onClick={onLogout}
        className="px-2.5 py-1 rounded-md border border-control text-text-primary hover:border-accent cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Cerrar sesión
      </button>
    </div>
  )
}

export default SessionBar

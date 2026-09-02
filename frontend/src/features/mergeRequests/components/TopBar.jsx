function dotClass({ loading, error, lastFetched }) {
  if (loading) return 'bg-draft'
  if (error) return 'bg-conflict'
  if (lastFetched) return 'bg-ready'
  return 'bg-text-faint'
}

function formatTime(date) {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function StatusText({ loading, error, lastFetched }) {
  if (loading) return <span>Actualizando...</span>
  if (error) return <span>Error</span>
  if (lastFetched) return <span>{formatTime(lastFetched)}</span>
  return <span>Sin datos</span>
}

function TopBar({ meta = null, loading = false, error = null, lastFetched = null, onRefresh }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
      <div>
        <h1 className="text-lg font-semibold">Tablero de MRs</h1>
        <p className="text-[12.5px] font-mono text-text-muted">
          {meta
            ? `${meta.projectCount} proyectos · ${meta.totalMRs} MRs abiertas`
            : 'Cargando...'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-text-muted px-2.5 py-1 border border-border rounded-full bg-surface" role="status">
          <span
            className={`${dotClass({ loading, error, lastFetched })} w-[7px] h-[7px] rounded-full flex-none`}
            aria-hidden="true"
          />
          <StatusText loading={loading} error={error} lastFetched={lastFetched} />
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-[13px] px-3 py-1.5 rounded-md bg-surface-raised border border-control text-text-primary hover:border-accent disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Refrescar ahora
        </button>
      </div>
    </div>
  )
}

export default TopBar

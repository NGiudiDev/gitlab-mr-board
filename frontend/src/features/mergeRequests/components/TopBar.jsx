function dotClass({ loading, error, lastFetched }) {
  if (loading) return "bg-draft";
  if (error) return "bg-conflict";
  if (lastFetched) return "bg-ready";
  return "bg-text-faint";
}

function formatTime(date) {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function StatusText({ error, lastFetched, loading }) {
  if (loading) return <span>Actualizando...</span>;
  if (error) return <span>Error</span>;
  if (lastFetched) return <span>{formatTime(lastFetched)}</span>;
  return <span>Sin datos</span>;
}

/**
 * Resumen del tablero: totales, estado de la sincronización y actualización
 * manual. El título de la aplicación lo presenta el layout, así que esta barra
 * se queda sólo con lo que cambia cuando llegan datos nuevos.
 */
export function TopBar({ error = null, lastFetched = null, loading = false, meta = null, onRefresh }) {
  return (
    <div className="flex items-center gap-2.5">
      <p className="text-[12.5px] font-mono text-text-muted">
        {meta
          ? `${meta.projectCount} proyectos · ${meta.totalMRs} MRs abiertas`
          : "Cargando..."}
      </p>

      <span className="inline-flex items-center gap-1.5 text-[12px] text-text-muted px-2.5 py-1 border border-border rounded-full bg-surface" role="status">
        <span
          aria-hidden="true"
          className={`${dotClass({ error, lastFetched, loading })} w-[7px] h-[7px] rounded-full flex-none`}
        />
        <StatusText error={error} lastFetched={lastFetched} loading={loading} />
      </span>

      <button
        className="text-[13px] px-3 py-1.5 rounded-md bg-surface-raised border border-control text-text-primary hover:border-accent disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        disabled={loading}
        onClick={onRefresh}
        type="button"
      >
        Refrescar ahora
      </button>
    </div>
  );
}

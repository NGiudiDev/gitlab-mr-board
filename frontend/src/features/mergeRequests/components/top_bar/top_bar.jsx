import { Styles } from "./top_bar.style.js";

function dotColor({ loading, error, lastFetched }) {
  if (loading) return "var(--color-draft)";
  if (error) return "var(--color-conflict)";
  if (lastFetched) return "var(--color-ready)";
  return "var(--color-text-faint)";
}

function formatTime(date) {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function StatusText(props) {
  const { error, lastFetched, loading } = props;

  if (loading) return <span>Actualizando...</span>;
  if (error) return <span>Error</span>;
  if (lastFetched) return <span>{formatTime(lastFetched)}</span>;
  return <span>Sin datos</span>;
}

export function TopBar(props) {
  const { error = null, lastFetched = null, loading = false, meta = null, onRefresh } = props;

  return (
    <Styles.Bar>
      <Styles.Summary>
        {meta
          ? `${meta.projectCount} proyectos · ${meta.totalMRs} MRs abiertas`
          : "Cargando..."}
      </Styles.Summary>

      <Styles.Status role="status">
        <Styles.StatusDot
          $color={dotColor({ error, lastFetched, loading })}
          aria-hidden="true"
        />
        <StatusText error={error} lastFetched={lastFetched} loading={loading} />
      </Styles.Status>

      <Styles.RefreshButton
        disabled={loading}
        onClick={onRefresh}
        type="button"
      >
        Refrescar ahora
      </Styles.RefreshButton>
    </Styles.Bar>
  );
}

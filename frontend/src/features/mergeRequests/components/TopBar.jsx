import styled from "styled-components";

import { Styles } from "../../../app/app.styles.jsx";

function dotColor({ loading, error, lastFetched }) {
  if (loading) return "var(--color-draft)";
  if (error) return "var(--color-conflict)";
  if (lastFetched) return "var(--color-ready)";
  return "var(--color-text-faint)";
}

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

const Summary = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.78125rem;
`;

const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.75rem;
`;

const StatusDot = styled.span`
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
`;

const RefreshButton = styled(Styles.SecondaryButton)`
  padding: 0.375rem 0.75rem;
  background: var(--color-surface-raised);
  font-size: 0.8125rem;
`;

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
    <Bar>
      <Summary>
        {meta
          ? `${meta.projectCount} proyectos · ${meta.totalMRs} MRs abiertas`
          : "Cargando..."}
      </Summary>

      <Status role="status">
        <StatusDot
          $color={dotColor({ error, lastFetched, loading })}
          aria-hidden="true"
        />
        <StatusText error={error} lastFetched={lastFetched} loading={loading} />
      </Status>

      <RefreshButton
        disabled={loading}
        onClick={onRefresh}
        type="button"
      >
        Refrescar ahora
      </RefreshButton>
    </Bar>
  );
}

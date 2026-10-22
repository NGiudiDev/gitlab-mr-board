import { TopBarStatus } from "../top_bar_status/top_bar_status.jsx";

import { Styles } from "./top_bar.style.js";

export function TopBar(props) {
  const {
    error = null,
    lastFetched = null,
    loading = false,
    meta = null,
    onRefresh = () => {},
  } = props;

  return (
    <Styles.Bar>
      <Styles.Summary>
        {meta
          ? `${meta.projectCount} proyectos · ${meta.totalMRs} MRs abiertas`
          : "Cargando..."}
      </Styles.Summary>

      <TopBarStatus error={error} lastFetched={lastFetched} loading={loading} />

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

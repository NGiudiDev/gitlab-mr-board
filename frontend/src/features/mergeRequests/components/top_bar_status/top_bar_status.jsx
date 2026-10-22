import { Styles } from "./top_bar_status.style.js";

import { formatClockTime } from "../../utils/merge_request_format.utils.js";
import { statusDotColor } from "../../utils/board_status.utils.js";

/** Resultado de la última consulta al backend: actualizando, error u hora. */
export function TopBarStatus(props) {
  const { error = null, lastFetched = null, loading = false } = props;

  function statusText() {
    if (loading) return "Actualizando...";
    if (error) return "Error";
    if (lastFetched) return formatClockTime(lastFetched);

    return "Sin datos";
  }

  return (
    <Styles.Status role="status">
      <Styles.StatusDot
        $color={statusDotColor({ error, lastFetched, loading })}
        aria-hidden="true"
      />

      <span>{statusText()}</span>
    </Styles.Status>
  );
}

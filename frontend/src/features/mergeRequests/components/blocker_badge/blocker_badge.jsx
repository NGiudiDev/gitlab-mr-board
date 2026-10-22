import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./blocker_badge.style.js";

import { describeBlocker } from "../../utils/blocker_badge.utils.js";

/** Badge de un bloqueante del merge request: CI, hilos, approvals o conflictos. */
export function BlockerBadge(props) {
  const { data, type } = props;

  const { colors, icon, label, linkUrl, tooltip } = describeBlocker(type, data);

  return (
    <Styles.Badge
      $colors={colors}
      aria-label={`${tooltip}${linkUrl ? ". Abre en una pestaña nueva." : ""}`}
      as={linkUrl ? "a" : "span"}
      href={linkUrl || undefined}
      rel={linkUrl ? "noopener" : undefined}
      target={linkUrl ? "_blank" : undefined}
      title={tooltip}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
      {linkUrl ? <AppStyles.VisuallyHidden>(abre en una pestaña nueva)</AppStyles.VisuallyHidden> : null}
    </Styles.Badge>
  );
}

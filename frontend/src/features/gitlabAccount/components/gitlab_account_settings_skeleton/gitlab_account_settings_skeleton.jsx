import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { Styles } from "./gitlab_account_settings_skeleton.style.js";

export function GitlabAccountSettingsSkeleton(props) {
  const { canEdit = false } = props;

  return (
    <div aria-busy="true" role="status">
      <AppStyles.VisuallyHidden>Cargando la configuración...</AppStyles.VisuallyHidden>

      <Styles.SkeletonContent aria-hidden="true">
        <div>
          <Styles.SkeletonLine $width="7rem" />
          <Styles.SkeletonField />
          <Styles.SkeletonLine $hint $width="80%" />
        </div>

        <div>
          <Styles.SkeletonLine $width="5rem" />
          <Styles.SkeletonField />
          <Styles.SkeletonLine $hint $width="60%" />
        </div>

        {canEdit ? <Styles.SkeletonButton /> : null}
      </Styles.SkeletonContent>
    </div>
  );
}

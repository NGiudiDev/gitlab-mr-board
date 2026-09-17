import {
  DETAIL_LIST_CLASSES,
  DETAIL_VALUE_CLASSES,
  LABEL_CLASSES,
  LOADING_TEXT_CLASSES,
} from "../../../app/constants/styles.consts.js";

export function GitlabAccountSettingsSummary({ settings = null }) {
  if (!settings) {
    return (
      <p className={LOADING_TEXT_CLASSES} role="status">
        Todavía no hay proyectos ni access token cargados. Pedíselo a quien administra la cuenta.
      </p>
    );
  }

  return (
    <dl className={DETAIL_LIST_CLASSES}>
      <dt className={LABEL_CLASSES}>Proyectos</dt>
      <dd className={`${DETAIL_VALUE_CLASSES} mb-3 font-mono`}>{settings.projectIds.join(", ")}</dd>
      <dt className={LABEL_CLASSES}>Access token</dt>
      <dd className={DETAIL_VALUE_CLASSES}>
        Guardado, terminado en «{settings.tokenHint}».
      </dd>
    </dl>
  );
}

import { LABEL_CLASSES } from "../../../assets/constants.js";

export function GitlabAccountSettingsSummary({ settings = null }) {
  if (!settings) {
    return (
      <p className="text-[13px] text-text-muted" role="status">
        Todavía no hay proyectos ni access token cargados. Pedíselo a quien administra la cuenta.
      </p>
    );
  }

  return (
    <dl className="text-[13px]">
      <dt className={LABEL_CLASSES}>Proyectos</dt>
      <dd className="mb-3 mt-1 font-mono text-text-primary">{settings.projectIds.join(", ")}</dd>
      <dt className={LABEL_CLASSES}>Access token</dt>
      <dd className="mt-1 text-text-primary">
        Guardado, terminado en «{settings.tokenHint}».
      </dd>
    </dl>
  );
}

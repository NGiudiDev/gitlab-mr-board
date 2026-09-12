import { LABEL_CLASSES } from "../../../assets/constants.js";

export function GitlabAccountSettingsSummary(props) {
  const { settings = null } = props;
  if (!settings) {
    return (
      <p role="status" className="text-[13px] text-text-muted">
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
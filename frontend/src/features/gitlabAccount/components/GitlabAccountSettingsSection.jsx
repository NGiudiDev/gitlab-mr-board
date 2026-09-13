import { useGitlabSettings } from "../hooks/useGitlabSettings.js";

import { GitlabAccountSettingsForm } from "./GitlabAccountSettingsForm.jsx";
import { GitlabAccountSettingsSkeleton } from "./GitlabAccountSettingsSkeleton.jsx";
import { GitlabAccountSettingsSummary } from "./GitlabAccountSettingsSummary.jsx";

/**
 * Coordina la carga y la presentación de la configuración de GitLab de la cuenta.
 *
 * @param {object} props Propiedades de la sección.
 * @param {boolean} [props.canEdit] Indica si la persona puede editar la configuración.
 * @param {Function} [props.onSaved] Avisa que el tablero debe actualizar sus datos.
 * @returns {import("react").ReactElement} Sección de configuración de GitLab.
 */
export function GitlabAccountSettingsSection({
  canEdit = false,
  onSaved = () => {},
}) {
  const { settings, loading, error, saving, save } = useGitlabSettings();

  return (
    <section aria-labelledby="gitlab-heading">
      <h2 className="text-base font-semibold text-text-primary mb-1" id="gitlab-heading">
        Cuenta de GitLab
      </h2>

      <p className="text-[12.5px] text-text-muted mb-4">
        {canEdit
          ? "El tablero muestra los merge requests de estos proyectos. Los cargás una vez y los ve todo el equipo."
          : "El tablero se alimenta de estos proyectos. Los carga quien administra la cuenta, así que no tenés que cargar tu propio access token."}
      </p>

      {error ? (
        <p className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <GitlabAccountSettingsSkeleton canEdit={canEdit} />
      ) : !canEdit ? (
        <GitlabAccountSettingsSummary settings={settings} />
      ) : (
        <GitlabAccountSettingsForm
          onSaved={onSaved}
          save={save}
          saving={saving}
          settings={settings}
        />
      )}
    </section>
  );
}

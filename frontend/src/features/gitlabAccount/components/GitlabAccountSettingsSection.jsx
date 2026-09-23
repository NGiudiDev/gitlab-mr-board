import {
  Alert,
  SectionDescription,
  SectionHeading,
} from "../../../app/constants/styles.consts.js";

import { useGitlabSettings } from "../hooks/useGitlabSettings.js";
import { GitlabAccountSettingsForm } from "./GitlabAccountSettingsForm.jsx";
import { GitlabAccountSettingsSkeleton } from "./GitlabAccountSettingsSkeleton.jsx";
import { GitlabAccountSettingsSummary } from "./GitlabAccountSettingsSummary.jsx";

export function GitlabAccountSettingsSection(props) {
  const { canEdit = false, onSaved = () => {} } = props;

  const { settings, loading, error, saving, save } = useGitlabSettings();

  return (
    <section aria-labelledby="gitlab-heading">
      <SectionHeading id="gitlab-heading">
        Cuenta de GitLab
      </SectionHeading>

      <SectionDescription>
        {canEdit
          ? "El tablero muestra los merge requests de estos proyectos. Los cargás una vez y los ve todo el equipo."
          : "El tablero se alimenta de estos proyectos. Los carga quien administra la cuenta, así que no tenés que cargar tu propio access token."}
      </SectionDescription>

      {error ? (
        <Alert role="alert">
          {error}
        </Alert>
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

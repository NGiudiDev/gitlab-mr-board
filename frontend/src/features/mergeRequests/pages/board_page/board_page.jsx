import { useMergeRequests } from "../../hooks/useMergeRequests.js";

import { BoardStatus } from "../../components/board_status/board_status.jsx";
import { MissingGitlabSettings } from "../../components/missing_gitlab_settings/missing_gitlab_settings.jsx";
import { MrBoard } from "../../components/mr_board/mr_board.jsx";
import { TopBar } from "../../components/top_bar/top_bar.jsx";
import { ViewControls } from "../../components/view_controls/view_controls.jsx";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./board_page.style.js";

import { findPersonByUsername, mergeRequestsForPerson } from "../../utils/personal_view.utils.js";

/**
 * Construye el anuncio accesible correspondiente al estado actual del tablero.
 *
 * @param {object} state Estado visible y filtros activos del tablero.
 * @returns {string} Mensaje que debe anunciar la región viva.
 */
function announcementFor({
  canChoosePerson,
  error,
  lastFetched,
  loading,
  needsGitlabSettings,
  selectedPerson,
  total,
  viewMode,
}) {
  if (loading) return "Actualizando merge requests.";
  if (error) return `No se pudieron actualizar los datos: ${error}`;
  if (needsGitlabSettings) return "Falta configurar GitLab en la cuenta.";
  if (!lastFetched) return "";
  if (viewMode === "personal" && !selectedPerson) {
    return canChoosePerson
      ? "Vista personal. Elegí una persona."
      : "Vista personal. Falta tu nickname de GitLab en «Mi cuenta».";
  }
  if (viewMode === "personal") {
    return `Vista personal de ${selectedPerson.name}. Se muestran ${total} merge requests.`;
  }
  return `Actualización completa. Se muestran ${total} merge requests.`;
}

export function BoardPage(props) {
  const {
    canChoosePerson = false,
    canConfigureGitlab = false,
  } = props;

  const {
    mergeRequests,
    meta,
    loading,
    error,
    lastFetched,
    needsGitlabSettings,
    viewMode,
    selectedUsername,
    fetchMRs,
    selectPerson,
    setViewMode,
  } = useMergeRequests();

  const people = meta?.people ?? [];
  const personalUsername = canChoosePerson ? selectedUsername : meta?.viewerUsername ?? null;
  const selectedPerson = findPersonByUsername(people, personalUsername)
    ?? (personalUsername ? { name: `@${personalUsername}`, username: personalUsername } : null);
  const personalMergeRequests = mergeRequestsForPerson(mergeRequests, personalUsername);
  const visibleMergeRequests = viewMode === "personal" ? personalMergeRequests : mergeRequests;
  const visibleProjects = new Set(visibleMergeRequests.map((mergeRequest) => mergeRequest.projectPath)).size;
  const visibleMeta = meta ? {
    ...meta,
    projectCount: viewMode === "personal" ? visibleProjects : meta.projectCount,
    totalMRs: visibleMergeRequests.length,
  } : null;

  const statusAnnouncement = announcementFor({
    canChoosePerson,
    error,
    lastFetched,
    loading,
    needsGitlabSettings,
    selectedPerson,
    total: visibleMergeRequests.length,
    viewMode,
  });

  const failedWithoutData = error && mergeRequests.length === 0;

  if (needsGitlabSettings) {
    return <MissingGitlabSettings canConfigure={canConfigureGitlab} />;
  }

  return (
    <>
      <Styles.Toolbar>
        <ViewControls
          canChoosePerson={canChoosePerson}
          onPersonChange={selectPerson}
          onViewChange={setViewMode}
          people={people}
          selectedPersonName={selectedPerson?.name || ""}
          selectedUsername={selectedUsername || ""}
          viewMode={viewMode}
        />

        <TopBar
          error={error}
          lastFetched={lastFetched}
          loading={loading}
          meta={visibleMeta}
          onRefresh={() => fetchMRs(true)}
        />
      </Styles.Toolbar>

      {failedWithoutData ? (
        <AppStyles.StatusPanel role="alert">
          <Styles.ErrorHeading>No se pudo conectar al backend.</Styles.ErrorHeading>
          <Styles.ErrorDetail>{error}</Styles.ErrorDetail>
        </AppStyles.StatusPanel>
      ) : (
        <>
          <section aria-labelledby="tablero-heading">
            <Styles.BoardHeading
              $visible={viewMode === "personal" && Boolean(selectedPerson)}
              id="tablero-heading"
            >
              {viewMode === "personal" && selectedPerson
                ? `Tareas de ${selectedPerson.name} por estado`
                : "Merge requests por proyecto y estado"}
            </Styles.BoardHeading>

            {loading && mergeRequests.length === 0 ? (
              <BoardStatus>Cargando merge requests...</BoardStatus>
            ) : mergeRequests.length === 0 ? (
              <BoardStatus>No hay merge requests abiertos.</BoardStatus>
            ) : viewMode === "personal" && !personalUsername ? (
              <BoardStatus>
                {canChoosePerson
                  ? "Elegí una persona para ver sus tareas pendientes."
                  : "Configurá tu nickname de GitLab en «Mi cuenta» para ver tus tareas."}
              </BoardStatus>
            ) : viewMode === "personal" && personalMergeRequests.length === 0 ? (
              <BoardStatus>
                {canChoosePerson
                  ? "No hay tareas pendientes para esta persona."
                  : "No tenés tareas pendientes."}
              </BoardStatus>
            ) : (
              <MrBoard
                allProjects={meta?.allProjects || []}
                mergeRequests={visibleMergeRequests}
              />
            )}
          </section>

          {lastFetched ? (
            <Styles.LastUpdated>
              Última actualización: {lastFetched.toLocaleTimeString("es-AR")} · {visibleMergeRequests.length} MRs {viewMode === "personal" ? "visibles" : "en total"} · Próxima actualización automática en 5 min
            </Styles.LastUpdated>
          ) : null}
        </>
      )}

      <AppStyles.VisuallyHidden aria-atomic="true" aria-live="polite">{statusAnnouncement}</AppStyles.VisuallyHidden>
    </>
  );
}

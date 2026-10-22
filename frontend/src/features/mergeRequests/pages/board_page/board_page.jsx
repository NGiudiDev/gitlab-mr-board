import { Styles as AppStyles } from "../../../../app/app.styles.jsx";

import { BoardStatus } from "../../components/board_status/board_status.jsx";
import { MissingGitlabSettings } from "../../components/missing_gitlab_settings/missing_gitlab_settings.jsx";
import { MrBoard } from "../../components/mr_board/mr_board.jsx";
import { TopBar } from "../../components/top_bar/top_bar.jsx";
import { ViewControls } from "../../components/view_controls/view_controls.jsx";

import { Styles } from "./board_page.style.js";

import { useMergeRequests } from "../../hooks/useMergeRequests.js";

import {
  buildBoardAnnouncement,
  buildBoardEmptyMessage,
  buildBoardHeading,
} from "../../utils/board_messages.utils.js";
import { buildBoardView } from "../../utils/board_view.utils.js";

import { VIEW_MODES } from "../../constants/merge_request_view.consts.js";

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
    saveUploadDate,
    selectPerson,
    setViewMode,
  } = useMergeRequests();

  const {
    people,
    personalMergeRequests,
    personalUsername,
    selectedPerson,
    visibleMergeRequests,
    visibleMeta,
  } = buildBoardView({ canChoosePerson, mergeRequests, meta, selectedUsername, viewMode });

  const emptyMessage = buildBoardEmptyMessage({
    canChoosePerson,
    loading,
    personalTotal: personalMergeRequests.length,
    personalUsername,
    total: mergeRequests.length,
    viewMode,
  });

  const statusAnnouncement = buildBoardAnnouncement({
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
              $visible={viewMode === VIEW_MODES.personal && Boolean(selectedPerson)}
              id="tablero-heading"
            >
              {buildBoardHeading(viewMode, selectedPerson)}
            </Styles.BoardHeading>

            {emptyMessage ? (
              <BoardStatus>{emptyMessage}</BoardStatus>
            ) : (
              <MrBoard
                allProjects={meta?.allProjects || []}
                mergeRequests={visibleMergeRequests}
                onUploadDateChange={saveUploadDate}
              />
            )}
          </section>

          {lastFetched ? (
            <Styles.LastUpdated>
              Última actualización: {lastFetched.toLocaleTimeString("es-AR")} · {visibleMergeRequests.length} MRs {viewMode === VIEW_MODES.personal ? "visibles" : "en total"} · Próxima actualización automática en 5 min
            </Styles.LastUpdated>
          ) : null}
        </>
      )}

      <AppStyles.VisuallyHidden aria-atomic="true" aria-live="polite">{statusAnnouncement}</AppStyles.VisuallyHidden>
    </>
  );
}

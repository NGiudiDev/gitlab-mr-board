import styled from "styled-components";

import {
  StatusPanel,
  visuallyHiddenStyles,
  VisuallyHidden,
} from "../../../app/constants/styles.consts.js";

import { BoardStatus } from "../components/BoardStatus.jsx";
import { MissingGitlabSettings } from "../components/MissingGitlabSettings.jsx";
import { MrBoard } from "../components/MrBoard.jsx";
import { TopBar } from "../components/TopBar.jsx";
import { ViewControls } from "../components/ViewControls.jsx";
import { useMergeRequests } from "../hooks/useMergeRequests.js";
import { findPersonByUsername, mergeRequestsForPerson } from "../personalView.js";

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.25rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-soft);
`;

const ErrorHeading = styled.p`
  margin: 0 0 0.5rem;
`;

const ErrorDetail = styled.p`
  margin: 0;
  color: var(--color-conflict);
  font-size: 0.75rem;
`;

const BoardHeading = styled.h2`
  margin: 0 0 0.75rem;
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;

  ${({ $visible }) => !$visible && visuallyHiddenStyles}
`;

const LastUpdated = styled.p`
  margin: 1rem 0 0;
  color: var(--color-text-faint);
  font-size: 0.75rem;
`;

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
  const { canChoosePerson = false, canConfigureGitlab = false } = props;

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
      <Toolbar>
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
      </Toolbar>

      {failedWithoutData ? (
        <StatusPanel role="alert">
          <ErrorHeading>No se pudo conectar al backend.</ErrorHeading>
          <ErrorDetail>{error}</ErrorDetail>
        </StatusPanel>
      ) : (
        <>
          <section aria-labelledby="tablero-heading">
            <BoardHeading
              $visible={viewMode === "personal" && Boolean(selectedPerson)}
              id="tablero-heading"
            >
              {viewMode === "personal" && selectedPerson
                ? `Tareas de ${selectedPerson.name} por estado`
                : "Merge requests por proyecto y estado"}
            </BoardHeading>

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
            <LastUpdated>
              Última actualización: {lastFetched.toLocaleTimeString("es-AR")} · {visibleMergeRequests.length} MRs {viewMode === "personal" ? "visibles" : "en total"} · Próxima actualización automática en 5 min
            </LastUpdated>
          ) : null}
        </>
      )}

      <VisuallyHidden aria-atomic="true" aria-live="polite">{statusAnnouncement}</VisuallyHidden>
    </>
  );
}

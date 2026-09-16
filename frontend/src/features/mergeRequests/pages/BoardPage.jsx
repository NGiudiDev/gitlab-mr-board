import { BOARD_STATUS_CLASSES, BoardStatus } from "../components/BoardStatus.jsx";
import { MissingGitlabSettings } from "../components/MissingGitlabSettings.jsx";
import { MrBoard } from "../components/MrBoard.jsx";
import { TopBar } from "../components/TopBar.jsx";
import { ViewControls } from "../components/ViewControls.jsx";
import { useMergeRequests } from "../hooks/useMergeRequests.js";
import { findPersonByUsername, mergeRequestsForPerson } from "../personalView.js";

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

/** Presenta el tablero y sus estados de carga, error y vista personal. */
function BoardPage({ canChoosePerson = false, canConfigureGitlab = false }) {
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border-soft pb-3">
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
      </div>

      {failedWithoutData ? (
        <div className={BOARD_STATUS_CLASSES} role="alert">
          <p className="mb-2">No se pudo conectar al backend.</p>
          <p className="text-conflict text-[12px]">{error}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="tablero-heading">
            <h2
              className={viewMode === "personal" && selectedPerson
                ? "text-base font-semibold text-text-primary mb-3"
                : "sr-only"}
              id="tablero-heading"
            >
              {viewMode === "personal" && selectedPerson
                ? `Tareas de ${selectedPerson.name} por estado`
                : "Merge requests por proyecto y estado"}
            </h2>
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
            <p className="text-[12px] text-text-faint mt-4">
              Última actualización: {lastFetched.toLocaleTimeString("es-AR")} · {visibleMergeRequests.length} MRs {viewMode === "personal" ? "visibles" : "en total"} · Próxima actualización automática en 5 min
            </p>
          ) : null}
        </>
      )}
      <p aria-atomic="true" aria-live="polite" className="sr-only">{statusAnnouncement}</p>
    </>
  );
}

export { BoardPage };

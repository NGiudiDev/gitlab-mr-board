import MrBoard from '../features/mergeRequests/components/MrBoard.jsx'
import TopBar from '../features/mergeRequests/components/TopBar.jsx'
import { useMergeRequests } from '../features/mergeRequests/hooks/useMergeRequests.js'

const PLACEHOLDER_CLASSES = 'text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface'

function announcementFor({ loading, error, lastFetched, total }) {
  if (loading) return 'Actualizando merge requests.'
  if (error) return `No se pudieron actualizar los datos: ${error}`
  if (!lastFetched) return ''
  return `Actualización completa. Se muestran ${total} merge requests.`
}

function App() {
  const { mergeRequests, meta, loading, error, lastFetched, fetchMRs } = useMergeRequests()

  const statusAnnouncement = announcementFor({
    loading,
    error,
    lastFetched,
    total: mergeRequests.length,
  })

  const failedWithoutData = error && mergeRequests.length === 0

  return (
    <>
      <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-bg">
        Saltar al contenido principal
      </a>
      <main id="contenido-principal" className="px-5 py-5 max-w-[1600px] mx-auto" tabIndex={-1}>
        <TopBar
          meta={meta}
          loading={loading}
          error={error}
          lastFetched={lastFetched}
          onRefresh={() => fetchMRs(true)}
        />

        {failedWithoutData ? (
          <div role="alert" className={PLACEHOLDER_CLASSES}>
            <p className="mb-2">No se pudo conectar al backend.</p>
            <p className="text-conflict text-[12px]">{error}</p>
          </div>
        ) : (
          <>
            <section aria-labelledby="tablero-heading">
              <h2 id="tablero-heading" className="sr-only">Merge requests por proyecto y estado</h2>
              {loading && mergeRequests.length === 0 ? (
                <div role="status" className={PLACEHOLDER_CLASSES}>Cargando merge requests...</div>
              ) : mergeRequests.length === 0 ? (
                <div role="status" className={PLACEHOLDER_CLASSES}>
                  No hay merge requests abiertos.
                </div>
              ) : (
                <MrBoard mergeRequests={mergeRequests} allProjects={meta?.allProjects || []} />
              )}
            </section>

            {lastFetched ? (
              <p className="text-[12px] text-text-faint mt-4">
                Última actualización: {lastFetched.toLocaleTimeString('es-AR')} · {meta?.totalMRs || 0} MRs en total · Próxima actualización automática en 5 min
              </p>
            ) : null}
          </>
        )}
        <p className="sr-only" aria-live="polite" aria-atomic="true">{statusAnnouncement}</p>
      </main>
    </>
  )
}

export default App

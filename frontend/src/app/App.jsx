// 2. Dependencias externas.
import { useEffect, useState } from 'react'

// 7. Imports relativos restantes.
import AccountPanel from '../features/auth/components/AccountPanel.jsx'
import LoginForm from '../features/auth/components/LoginForm.jsx'
import RegisterForm from '../features/auth/components/RegisterForm.jsx'
import SessionBar from '../features/auth/components/SessionBar.jsx'
import { useSession } from '../features/auth/hooks/useSession.js'
import MrBoard from '../features/mergeRequests/components/MrBoard.jsx'
import TopBar from '../features/mergeRequests/components/TopBar.jsx'
import ViewControls from '../features/mergeRequests/components/ViewControls.jsx'
import { resetStore, useMergeRequests } from '../features/mergeRequests/hooks/useMergeRequests.js'
import {
  findPersonByUsername,
  mergeRequestsForPerson,
} from '../features/mergeRequests/personalView.js'

const PLACEHOLDER_CLASSES = 'text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface'

/** Presenta de forma consistente los estados informativos del tablero. */
function BoardStatus({ children }) {
  return <div role="status" className={PLACEHOLDER_CLASSES}>{children}</div>
}

function announcementFor({ loading, error, lastFetched, total, viewMode, selectedPerson }) {
  if (loading) return 'Actualizando merge requests.'
  if (error) return `No se pudieron actualizar los datos: ${error}`
  if (!lastFetched) return ''
  if (viewMode === 'personal' && !selectedPerson) return 'Vista personal. Elegí una persona.'
  if (viewMode === 'personal') {
    return `Vista personal de ${selectedPerson.name}. Se muestran ${total} merge requests.`
  }
  return `Actualización completa. Se muestran ${total} merge requests.`
}

/**
 * Tablero de merge requests. Se monta sólo con la sesión abierta, así el
 * polling arranca recién cuando el backend va a aceptar las peticiones.
 */
function Board() {
  const {
    mergeRequests,
    meta,
    loading,
    error,
    lastFetched,
    viewMode,
    selectedUsername,
    fetchMRs,
    selectPerson,
    setViewMode,
  } = useMergeRequests()
  const people = meta?.people ?? []
  const selectedPerson = findPersonByUsername(people, selectedUsername)
    ?? (selectedUsername ? { name: `@${selectedUsername}`, username: selectedUsername } : null)
  const personalMergeRequests = mergeRequestsForPerson(mergeRequests, selectedUsername)
  const visibleMergeRequests = viewMode === 'personal' ? personalMergeRequests : mergeRequests
  const visibleProjects = new Set(visibleMergeRequests.map((mr) => mr.projectPath)).size
  const visibleMeta = meta ? {
    ...meta,
    projectCount: viewMode === 'personal' ? visibleProjects : meta.projectCount,
    totalMRs: visibleMergeRequests.length,
  } : null

  const statusAnnouncement = announcementFor({
    loading,
    error,
    lastFetched,
    total: visibleMergeRequests.length,
    viewMode,
    selectedPerson,
  })

  const failedWithoutData = error && mergeRequests.length === 0

  return (
    <>
      <TopBar
        meta={visibleMeta}
        loading={loading}
        error={error}
        lastFetched={lastFetched}
        onRefresh={() => fetchMRs(true)}
      />

      <ViewControls
        viewMode={viewMode}
        people={people}
        selectedUsername={selectedUsername || ''}
        selectedPersonName={selectedPerson?.name || ''}
        onViewChange={setViewMode}
        onPersonChange={selectPerson}
      />

      {failedWithoutData ? (
        <div role="alert" className={PLACEHOLDER_CLASSES}>
          <p className="mb-2">No se pudo conectar al backend.</p>
          <p className="text-conflict text-[12px]">{error}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="tablero-heading">
            <h2
              id="tablero-heading"
              className={viewMode === 'personal' && selectedPerson
                ? 'text-base font-semibold text-text-primary mb-3'
                : 'sr-only'}
            >
              {viewMode === 'personal' && selectedPerson
                ? `Tareas de ${selectedPerson.name} por estado`
                : 'Merge requests por proyecto y estado'}
            </h2>
            {loading && mergeRequests.length === 0 ? (
              <BoardStatus>Cargando merge requests...</BoardStatus>
            ) : mergeRequests.length === 0 ? (
              <BoardStatus>No hay merge requests abiertos.</BoardStatus>
            ) : viewMode === 'personal' && !selectedUsername ? (
              <BoardStatus>Elegí una persona para ver sus tareas pendientes.</BoardStatus>
            ) : viewMode === 'personal' && personalMergeRequests.length === 0 ? (
              <BoardStatus>No hay tareas pendientes para esta persona.</BoardStatus>
            ) : (
              <MrBoard
                mergeRequests={visibleMergeRequests}
                allProjects={meta?.allProjects || []}
              />
            )}
          </section>

          {lastFetched ? (
            <p className="text-[12px] text-text-faint mt-4">
              Última actualización: {lastFetched.toLocaleTimeString('es-AR')} · {visibleMergeRequests.length} MRs {viewMode === 'personal' ? 'visibles' : 'en total'} · Próxima actualización automática en 5 min
            </p>
          ) : null}
        </>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">{statusAnnouncement}</p>
    </>
  )
}

/** Presenta el ingreso o el alta de cuenta según lo que pida la persona. */
function AnonymousView({ error, notice, submitting, onLogin, onRegister }) {
  const [showRegister, setShowRegister] = useState(false)

  if (showRegister) {
    return (
      <RegisterForm
        error={error}
        submitting={submitting}
        onSubmit={onRegister}
        onShowLogin={() => setShowRegister(false)}
      />
    )
  }

  return (
    <LoginForm
      error={error}
      notice={notice}
      submitting={submitting}
      onSubmit={onLogin}
      onShowRegister={() => setShowRegister(true)}
    />
  )
}

/** Decide si mostrar el ingreso, el tablero o la cuenta según la sesión. */
function App() {
  const {
    user,
    status,
    error,
    notice,
    submitting,
    changeOwnPassword,
    login,
    logout,
    register,
  } = useSession()
  const [view, setView] = useState('board')
  const isAuthenticated = status === 'authenticated'

  // Al terminar la sesión, la próxima empieza en el tablero y no donde quedó
  // la anterior.
  useEffect(() => {
    if (!isAuthenticated) setView('board')
  }, [isAuthenticated])

  /** Cierra la sesión y descarta los datos del tablero del usuario anterior. */
  async function handleLogout() {
    await logout()
    resetStore()
  }

  return (
    <>
      <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-bg">
        Saltar al contenido principal
      </a>
      <main id="contenido-principal" className="px-5 py-5 max-w-[1600px] mx-auto" tabIndex={-1}>
        {status === 'checking' ? (
          <BoardStatus>Verificando tu sesión...</BoardStatus>
        ) : isAuthenticated ? (
          <>
            <SessionBar
              user={user}
              view={view}
              onChangeView={setView}
              onLogout={handleLogout}
            />
            {view === 'board' ? (
              <Board />
            ) : (
              <AccountPanel
                user={user}
                submitting={submitting}
                onChangePassword={changeOwnPassword}
              />
            )}
          </>
        ) : (
          <AnonymousView
            error={error}
            notice={notice}
            submitting={submitting}
            onLogin={login}
            onRegister={register}
          />
        )}
      </main>
    </>
  )
}

export default App

// 2. Dependencias externas.
import { useEffect, useState } from 'react'

// 7. Imports relativos restantes.
import AccountPanel from '../features/accounts/components/AccountPanel.jsx'
import { resetAccountStore } from '../features/accounts/hooks/useAccount.js'
import GitlabIdentityPanel from '../features/auth/components/GitlabIdentityPanel.jsx'
import LoginForm from '../features/auth/components/LoginForm.jsx'
import PasswordPanel from '../features/auth/components/PasswordPanel.jsx'
import RegisterForm from '../features/auth/components/RegisterForm.jsx'
import UserAdmin from '../features/auth/components/UserAdmin.jsx'
import { useSession } from '../features/auth/hooks/useSession.js'
import GitlabSettingsForm from '../features/gitlabSettings/components/GitlabSettingsForm.jsx'
import MrBoard from '../features/mergeRequests/components/MrBoard.jsx'
import TopBar from '../features/mergeRequests/components/TopBar.jsx'
import ViewControls from '../features/mergeRequests/components/ViewControls.jsx'
import {
  fetchMergeRequests,
  resetStore,
  useMergeRequests,
} from '../features/mergeRequests/hooks/useMergeRequests.js'
import {
  findPersonByUsername,
  mergeRequestsForPerson,
} from '../features/mergeRequests/personalView.js'
import AppShell, { sectionsFor } from './AppShell.jsx'

const PLACEHOLDER_CLASSES = 'text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface'

/** Presenta de forma consistente los estados informativos del tablero. */
function BoardStatus({ children }) {
  return <div role="status" className={PLACEHOLDER_CLASSES}>{children}</div>
}

function announcementFor({
  loading,
  error,
  lastFetched,
  needsGitlabSettings,
  total,
  viewMode,
  selectedPerson,
  canChoosePerson,
}) {
  if (loading) return 'Actualizando merge requests.'
  if (error) return `No se pudieron actualizar los datos: ${error}`
  if (needsGitlabSettings) return 'Falta configurar GitLab en la cuenta.'
  if (!lastFetched) return ''
  if (viewMode === 'personal' && !selectedPerson) {
    return canChoosePerson
      ? 'Vista personal. Elegí una persona.'
      : 'Vista personal. Falta tu nickname de GitLab en «Mi cuenta».'
  }
  if (viewMode === 'personal') {
    return `Vista personal de ${selectedPerson.name}. Se muestran ${total} merge requests.`
  }
  return `Actualización completa. Se muestran ${total} merge requests.`
}

/**
 * Aviso de que la cuenta todavía no tiene datos de GitLab.
 *
 * Quien administra puede resolverlo desde «Mi cuenta»; al resto no le sirve ir
 * ahí, porque el backend le va a rechazar el guardado: lo que necesita es
 * saber a quién pedírselo.
 */
function MissingGitlabSettings({ canConfigure = false, onGoToAccount = () => {} }) {
  return (
    <div role="status" className={PLACEHOLDER_CLASSES}>
      <p className="mb-3">
        {canConfigure
          ? 'Todavía no configuraste GitLab en tu cuenta.'
          : 'Tu cuenta todavía no tiene datos de GitLab. Pedile a quien la administra que cargue los proyectos y el access token.'}
      </p>
      {canConfigure ? (
        <button
          type="button"
          onClick={onGoToAccount}
          className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Configurar en Mi cuenta
        </button>
      ) : null}
    </div>
  )
}

/**
 * Tablero de merge requests. Se monta sólo con la sesión abierta, así el
 * polling arranca recién cuando el backend va a aceptar las peticiones.
 */
function Board({ canChoosePerson = false, canConfigureGitlab = false, onGoToAccount = () => {} }) {
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
  } = useMergeRequests()
  const people = meta?.people ?? []
  // Quien no puede elegir sólo ve lo suyo: la identidad sale del nickname de
  // GitLab que configuró, no de la selección del tablero.
  const personalUsername = canChoosePerson ? selectedUsername : meta?.viewerUsername ?? null
  const selectedPerson = findPersonByUsername(people, personalUsername)
    ?? (personalUsername ? { name: `@${personalUsername}`, username: personalUsername } : null)
  const personalMergeRequests = mergeRequestsForPerson(mergeRequests, personalUsername)
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
    needsGitlabSettings,
    total: visibleMergeRequests.length,
    viewMode,
    selectedPerson,
    canChoosePerson,
  })

  const failedWithoutData = error && mergeRequests.length === 0

  // Sin configuración no hay nada que consultar: los controles del tablero
  // sobran y lo único útil es explicar cómo se completa.
  if (needsGitlabSettings) {
    return (
      <MissingGitlabSettings canConfigure={canConfigureGitlab} onGoToAccount={onGoToAccount} />
    )
  }

  return (
    <>
      {/* Una sola fila reúne los controles de la vista y el estado de la
          sincronización, para que el tablero empiece lo más arriba posible. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border-soft pb-3">
        <ViewControls
          viewMode={viewMode}
          people={people}
          selectedUsername={selectedUsername || ''}
          selectedPersonName={selectedPerson?.name || ''}
          canChoosePerson={canChoosePerson}
          onViewChange={setViewMode}
          onPersonChange={selectPerson}
        />

        <TopBar
          meta={visibleMeta}
          loading={loading}
          error={error}
          lastFetched={lastFetched}
          onRefresh={() => fetchMRs(true)}
        />
      </div>

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
            ) : viewMode === 'personal' && !personalUsername ? (
              <BoardStatus>
                {canChoosePerson
                  ? 'Elegí una persona para ver sus tareas pendientes.'
                  : 'Configurá tu nickname de GitLab en «Mi cuenta» para ver tus tareas.'}
              </BoardStatus>
            ) : viewMode === 'personal' && personalMergeRequests.length === 0 ? (
              <BoardStatus>
                {canChoosePerson
                  ? 'No hay tareas pendientes para esta persona.'
                  : 'No tenés tareas pendientes.'}
              </BoardStatus>
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

/**
 * Presenta la sección elegida en la barra de navegación.
 *
 * «Mi cuenta» reúne, en ese orden, el equipo con el que se comparte el tablero,
 * los datos de GitLab de la cuenta, la identidad propia en GitLab y la
 * contraseña. Sólo un administrador puede cargar los datos de GitLab: son
 * compartidos, así que un cambio afecta a todo el equipo.
 */
function ActiveSection({ view, user, submitting, onChangePassword, onSaveGitlabUsername, onGoToAccount }) {
  const isAdmin = user.role === 'admin'

  if (view === 'account') {
    return (
      <div className="flex flex-col gap-5">
        <AccountPanel user={user} />
        {/* Al guardar se actualiza el store, así que el tablero ya no reclama
            la configuración cuando se vuelve a él. */}
        <GitlabSettingsForm canEdit={isAdmin} onSaved={() => fetchMergeRequests(true)} />
        <GitlabIdentityPanel
          user={user}
          submitting={submitting}
          onSave={onSaveGitlabUsername}
        />
        <PasswordPanel
          user={user}
          submitting={submitting}
          onChangePassword={onChangePassword}
        />
      </div>
    )
  }

  if (view === 'users') return <UserAdmin currentUsername={user.username} />

  // Sólo un admin puede mirar el tablero de otra persona; el resto ve el suyo.
  return (
    <Board
      canChoosePerson={isAdmin}
      canConfigureGitlab={isAdmin}
      onGoToAccount={onGoToAccount}
    />
  )
}

/** Decide si mostrar el ingreso o el layout con la sección activa. */
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
    saveGitlabUsername,
  } = useSession()
  const [view, setView] = useState('board')
  const isAuthenticated = status === 'authenticated'
  // Una sección que el usuario actual no tiene habilitada —la de usuarios si no
  // es admin— cae en el tablero en lugar de dejar la pantalla vacía.
  const availableSections = sectionsFor(user)
  const activeView = availableSections.some((section) => section.id === view) ? view : 'board'

  // Al terminar la sesión, la próxima empieza en el tablero y no donde quedó
  // la anterior.
  useEffect(() => {
    if (!isAuthenticated) setView('board')
  }, [isAuthenticated])

  /** Cierra la sesión y descarta los datos de la cuenta y del tablero. */
  async function handleLogout() {
    await logout()
    resetStore()
    resetAccountStore()
  }

  return (
    <AppShell
      user={isAuthenticated ? user : null}
      view={activeView}
      onChangeView={setView}
      onLogout={handleLogout}
    >
      {status === 'checking' ? (
        <BoardStatus>Verificando tu sesión...</BoardStatus>
      ) : isAuthenticated ? (
        <ActiveSection
          view={activeView}
          user={user}
          submitting={submitting}
          onChangePassword={changeOwnPassword}
          onSaveGitlabUsername={saveGitlabUsername}
          onGoToAccount={() => setView('account')}
        />
      ) : (
        <AnonymousView
          error={error}
          notice={notice}
          submitting={submitting}
          onLogin={login}
          onRegister={register}
        />
      )}
    </AppShell>
  )
}

export default App

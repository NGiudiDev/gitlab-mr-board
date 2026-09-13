// 2. Dependencias externas.
import { Link, Navigate, Route, Routes, useNavigate } from "react-router";

// 6. Imports relativos restantes.
import { AccountMemberInviteSection } from "../features/accounts/components/AccountMemberInviteSection.jsx";
import { AccountSettingsSection } from "../features/accounts/components/AccountSettingsSection.jsx";
import { resetAccountStore, useAccount } from "../features/accounts/hooks/useAccount.js";
import { LoginForm } from "../features/auth/components/LoginForm.jsx";
import { PasswordPanel } from "../features/auth/components/PasswordPanel.jsx";
import { ProfilePanel } from "../features/auth/components/ProfilePanel.jsx";
import { RegisterForm } from "../features/auth/components/RegisterForm.jsx";
import { UserAdmin } from "../features/auth/components/UserAdmin.jsx";
import { useSession } from "../features/auth/hooks/useSession.js";
import { GitlabAccountSettingsSection } from "../features/gitlabAccount/components/GitlabAccountSettingsSection.jsx";
import { GitlabUserSettingsSection } from "../features/gitlabUser/components/GitlabUserSettingsSection.jsx";
import { MrBoard } from "../features/mergeRequests/components/MrBoard.jsx";
import { TopBar } from "../features/mergeRequests/components/TopBar.jsx";
import { ViewControls } from "../features/mergeRequests/components/ViewControls.jsx";
import {
  fetchMergeRequests,
  resetStore,
  useMergeRequests,
} from "../features/mergeRequests/hooks/useMergeRequests.js";
import {
  findPersonByUsername,
  mergeRequestsForPerson,
} from "../features/mergeRequests/personalView.js";
import { AppShell } from "./AppShell.jsx";
import { APP_PATHS } from "./routes.js";

const PLACEHOLDER_CLASSES = "text-center text-text-muted text-[13px] py-16 border border-dashed border-border rounded-lg bg-surface";

/** Presenta de forma consistente los estados informativos del tablero. */
function BoardStatus({ children }) {
  return <div className={PLACEHOLDER_CLASSES} role="status">{children}</div>;
}
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

/**
 * Aviso de que la cuenta todavía no tiene datos de GitLab.
 *
 * Quien administra puede resolverlo desde «Mi cuenta»; al resto no le sirve ir
 * ahí, porque el backend le va a rechazar el guardado: lo que necesita es
 * saber a quién pedírselo.
 */
function MissingGitlabSettings({ canConfigure = false }) {
  return (
    <div className={PLACEHOLDER_CLASSES} role="status">
      <p className="mb-3">
        {canConfigure
          ? "Todavía no configuraste GitLab en tu cuenta."
          : "Tu cuenta todavía no tiene datos de GitLab. Pedile a quien la administra que cargue los proyectos y el access token."}
      </p>
      {canConfigure ? (
        <Link
          className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          to={APP_PATHS.account}
        >
          Configurar en Mi cuenta
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Tablero de merge requests. Se monta sólo con la sesión abierta, así el
 * polling arranca recién cuando el backend va a aceptar las peticiones.
 */
function Board({ canChoosePerson = false, canConfigureGitlab = false }) {
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
  // Quien no puede elegir sólo ve lo suyo: la identidad sale del nickname de
  // GitLab que configuró, no de la selección del tablero.
  const personalUsername = canChoosePerson ? selectedUsername : meta?.viewerUsername ?? null;
  const selectedPerson = findPersonByUsername(people, personalUsername)
    ?? (personalUsername ? { name: `@${personalUsername}`, username: personalUsername } : null);
  const personalMergeRequests = mergeRequestsForPerson(mergeRequests, personalUsername);
  const visibleMergeRequests = viewMode === "personal" ? personalMergeRequests : mergeRequests;
  const visibleProjects = new Set(visibleMergeRequests.map((mr) => mr.projectPath)).size;
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

  // Sin configuración no hay nada que consultar: los controles del tablero
  // sobran y lo único útil es explicar cómo se completa.
  if (needsGitlabSettings) {
    return (
      <MissingGitlabSettings canConfigure={canConfigureGitlab} />
    );
  }

  return (
    <>
      {/* Una sola fila reúne los controles de la vista y el estado de la
          sincronización, para que el tablero empiece lo más arriba posible. */}
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
        <div className={PLACEHOLDER_CLASSES} role="alert">
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

/** Declara las pantallas disponibles sin una sesión abierta. */
function AnonymousRoutes({ error, notice, onLogin, onRegister, submitting }) {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        element={(
          <LoginForm
            error={error}
            notice={notice}
            onShowRegister={() => navigate(APP_PATHS.register)}
            onSubmit={onLogin}
            submitting={submitting}
          />
        )}
        path={APP_PATHS.login}
      />
      <Route
        element={(
          <RegisterForm
            error={error}
            onShowLogin={() => navigate(APP_PATHS.login)}
            onSubmit={onRegister}
            submitting={submitting}
          />
        )}
        path={APP_PATHS.register}
      />
      <Route element={<Navigate replace to={APP_PATHS.login} />} path="*" />
    </Routes>
  );
}

/**
 * Presenta la configuración compartida de la cuenta y la personal de GitLab.
 *
 * «Mi cuenta» reúne el equipo, su invitación y los datos de GitLab,
 * incluido el nickname personal.
 */
function AccountView({
  onSaveGitlabUsername,
  submitting,
  user,
}) {
  const {
    account,
    error: accountError,
    loading: accountLoading,
    submitting: accountSubmitting,
    rotateInviteCode,
  } = useAccount(user.accountId);

  const isAdmin = user.role === "admin";

  return (
    <div className="mx-auto max-w-xl divide-y divide-border-soft [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      {accountLoading && !account ? (
        <section aria-label="Estado de la cuenta">
          <p className="text-[13px] text-text-muted" role="status">Cargando la cuenta...</p>
        </section>
      ) : accountError && !account ? (
        <section aria-label="Estado de la cuenta">
          <p className="rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary" role="alert">
            {accountError}
          </p>
        </section>
      ) : (
        <AccountSettingsSection account={account} />
      )}

      {isAdmin && account?.inviteCode ? (
        <AccountMemberInviteSection
          inviteCode={account.inviteCode}
          onRotate={rotateInviteCode}
          submitting={accountSubmitting}
        />
      ) : null}

      <GitlabAccountSettingsSection
        canEdit={isAdmin}
        onSaved={() => fetchMergeRequests(true)}
      />

      <GitlabUserSettingsSection
        onSave={onSaveGitlabUsername}
        submitting={submitting}
        user={user}
      />
    </div>
  );
}

/** Presenta los datos de acceso y el cambio de contraseña de la persona. */
function ProfileView({ onChangePassword, onSaveProfile, submitting, user }) {
  return (
    <div className="mx-auto max-w-xl divide-y divide-border-soft [&>section]:py-5 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
      <ProfilePanel onSave={onSaveProfile} submitting={submitting} user={user} />
      <PasswordPanel
        onChangePassword={onChangePassword}
        submitting={submitting}
        user={user}
      />
    </div>
  );
}

/** Declara las pantallas privadas y aplica sus permisos de acceso. */
function AuthenticatedRoutes({
  onChangePassword,
  onSaveGitlabUsername,
  onSaveProfile,
  submitting,
  user,
}) {
  const isAdmin = user.role === "admin";

  return (
    <Routes>
      <Route
        element={(
          <Board
            canChoosePerson={isAdmin}
            canConfigureGitlab={isAdmin}
          />
        )}
        path={APP_PATHS.board}
      />
      <Route
        element={(
          <AccountView
            onSaveGitlabUsername={onSaveGitlabUsername}
            submitting={submitting}
            user={user}
          />
        )}
        path={APP_PATHS.account}
      />
      <Route
        element={(
          <ProfileView
            onChangePassword={onChangePassword}
            onSaveProfile={onSaveProfile}
            submitting={submitting}
            user={user}
          />
        )}
        path={APP_PATHS.profile}
      />
      <Route
        element={isAdmin
          ? <UserAdmin currentEmail={user.email} />
          : <Navigate replace to={APP_PATHS.board} />}
        path={APP_PATHS.users}
      />
      <Route element={<Navigate replace to={APP_PATHS.board} />} path="*" />
    </Routes>
  );
}

/** Compone el layout privado y limpia los stores al cerrar la sesión. */
function AuthenticatedApp({
  changeOwnPassword,
  logout,
  saveGitlabUsername,
  saveProfile,
  submitting,
  user,
}) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    resetStore();
    resetAccountStore();
    navigate(APP_PATHS.login, { replace: true });
  }

  return (
    <AppShell onLogout={handleLogout} user={user}>
      <AuthenticatedRoutes
        onChangePassword={changeOwnPassword}
        onSaveGitlabUsername={saveGitlabUsername}
        onSaveProfile={saveProfile}
        submitting={submitting}
        user={user}
      />
    </AppShell>
  );
}

export function App() {
  const session = useSession();

  if (session.status === "checking") {
    return (
      <AppShell>
        <BoardStatus>Verificando tu sesión...</BoardStatus>
      </AppShell>
    );
  }

  if (session.status === "authenticated") {
    return (
      <AuthenticatedApp
        changeOwnPassword={session.changeOwnPassword}
        logout={session.logout}
        saveGitlabUsername={session.saveGitlabUsername}
        saveProfile={session.saveProfile}
        submitting={session.submitting}
        user={session.user}
      />
    );
  }

  return (
    <AppShell>
      <AnonymousRoutes
        error={session.error}
        notice={session.notice}
        onLogin={session.login}
        onRegister={session.register}
        submitting={session.submitting}
      />
    </AppShell>
  );
}

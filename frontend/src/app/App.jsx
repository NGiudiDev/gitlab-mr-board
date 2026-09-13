// 2. Dependencias externas.
import { useEffect, useState } from "react";

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
import { AppShell, sectionsFor } from "./AppShell.jsx";

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
function MissingGitlabSettings({ canConfigure = false, onGoToAccount = () => {} }) {
  return (
    <div className={PLACEHOLDER_CLASSES} role="status">
      <p className="mb-3">
        {canConfigure
          ? "Todavía no configuraste GitLab en tu cuenta."
          : "Tu cuenta todavía no tiene datos de GitLab. Pedile a quien la administra que cargue los proyectos y el access token."}
      </p>
      {canConfigure ? (
        <button
          className="rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={onGoToAccount}
          type="button"
        >
          Configurar en Mi cuenta
        </button>
      ) : null}
    </div>
  );
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
      <MissingGitlabSettings canConfigure={canConfigureGitlab} onGoToAccount={onGoToAccount} />
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

/** Presenta el ingreso o el alta de cuenta según lo que pida la persona. */
function AnonymousView({ error, notice, onLogin, onRegister, submitting }) {
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return (
      <RegisterForm
        error={error}
        onShowLogin={() => setShowRegister(false)}
        onSubmit={onRegister}
        submitting={submitting}
      />
    );
  }

  return (
    <LoginForm
      error={error}
      notice={notice}
      onShowRegister={() => setShowRegister(true)}
      onSubmit={onLogin}
      submitting={submitting}
    />
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

/** Presenta la sección elegida en la barra de navegación. */
function ActiveSection({
  onChangePassword,
  onGoToAccount,
  onSaveGitlabUsername,
  onSaveProfile,
  submitting,
  user,
  view,
}) {
  const isAdmin = user.role === "admin";

  if (view === "account") {
    return (
      <AccountView
        onSaveGitlabUsername={onSaveGitlabUsername}
        submitting={submitting}
        user={user}
      />
    );
  }

  if (view === "profile") {
    return (
      <ProfileView
        onChangePassword={onChangePassword}
        onSaveProfile={onSaveProfile}
        submitting={submitting}
        user={user}
      />
    );
  }

  if (view === "users") return <UserAdmin currentEmail={user.email} />;

  // Sólo un admin puede mirar el tablero de otra persona; el resto ve el suyo.
  return (
    <Board
      canChoosePerson={isAdmin}
      canConfigureGitlab={isAdmin}
      onGoToAccount={onGoToAccount}
    />
  );
}

/** Decide si mostrar el ingreso o el layout con la sección activa. */
export function App() {
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
    saveProfile,
  } = useSession();
  const [view, setView] = useState("board");
  const isAuthenticated = status === "authenticated";
  // Una sección que el usuario actual no tiene habilitada —la de usuarios si no
  // es admin— cae en el tablero en lugar de dejar la pantalla vacía.
  const availableSections = sectionsFor(user);
  const activeView = availableSections.some((section) => section.id === view) ? view : "board";

  // Al terminar la sesión, la próxima empieza en el tablero y no donde quedó
  // la anterior.
  useEffect(() => {
    if (!isAuthenticated) setView("board");
  }, [isAuthenticated]);

  /** Cierra la sesión y descarta los datos de la cuenta y del tablero. */
  async function handleLogout() {
    await logout();
    resetStore();
    resetAccountStore();
  }

  return (
    <AppShell
      onChangeView={setView}
      onLogout={handleLogout}
      user={isAuthenticated ? user : null}
      view={activeView}
    >
      {status === "checking" ? (
        <BoardStatus>Verificando tu sesión...</BoardStatus>
      ) : isAuthenticated ? (
        <ActiveSection
          onChangePassword={changeOwnPassword}
          onGoToAccount={() => setView("account")}
          onSaveGitlabUsername={saveGitlabUsername}
          onSaveProfile={saveProfile}
          submitting={submitting}
          user={user}
          view={activeView}
        />
      ) : (
        <AnonymousView
          error={error}
          notice={notice}
          onLogin={login}
          onRegister={register}
          submitting={submitting}
        />
      )}
    </AppShell>
  );
}

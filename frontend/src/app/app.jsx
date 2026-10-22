import { useLogout } from "../features/auth/hooks/useLogout.js";
import { useSession } from "../features/auth/hooks/useSession.js";

import { AppLayout } from "./components/app_layout/app_layout.jsx";
import { AuthenticatedRoutes } from "./components/authenticated_routes/authenticated_routes.jsx";
import { GuestRoutes } from "./components/guest_routes/guest_routes.jsx";

import { Styles } from "./app.styles.jsx";

export function App() {
  const logout = useLogout();
  const session = useSession();

  if (session.status === "checking") {
    return (
      <AppLayout>
        <Styles.StatusPanel role="status">
          Verificando tu sesión...
        </Styles.StatusPanel>
      </AppLayout>
    );
  }

  if (session.status === "authenticated") {
    return (
      <AppLayout onLogout={logout} user={session.user}>
        <AuthenticatedRoutes session={session} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <GuestRoutes session={session} />
    </AppLayout>
  );
}

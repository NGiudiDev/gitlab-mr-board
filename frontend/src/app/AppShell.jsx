// 2. Dependencias externas.
import { NavLink } from "react-router";

// 6. Imports relativos restantes.
import { AccountMenu } from "./AccountMenu.jsx";
import { sectionsFor } from "./routes.js";

const NAV_ITEM_CLASSES = "block rounded-md px-2.5 py-1 text-[13px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Layout de la aplicación: una barra superior mínima con el nombre del tablero,
 * la navegación principal y un menú con la cuenta, el acceso al perfil y la
 * sesión abierta; debajo, el contenido de la sección activa.
 *
 * La barra aparece sólo con la sesión abierta: el ingreso y el alta son
 * pantallas completas que traen su propio encabezado principal.
 */
export function AppShell({
  children,
  onLogout = () => {},
  user = null,
}) {
  return (
    <>
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-bg" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      {user ? (
        <header className="sticky top-0 z-40 border-b border-border bg-bg">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2 px-5 py-2.5">
            <h1 className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
              <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full bg-accent" />
              Tablero de MRs
            </h1>

            <nav aria-label="Secciones">
              <ul className="flex flex-wrap items-center gap-1">
                {sectionsFor(user).filter((section) => !section.menuOnly).map((section) => {
                  return (
                    <li key={section.id}>
                      <NavLink
                        className={({ isActive }) => `${NAV_ITEM_CLASSES} ${isActive
                          ? "bg-surface-raised font-semibold text-text-primary"
                          : "text-text-muted hover:text-text-primary"}`}
                        to={section.path}
                      >
                        {section.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <AccountMenu
              onLogout={onLogout}
              user={user}
            />
          </div>
        </header>
      ) : null}

      {/* `scroll-mt` deja el inicio del contenido fuera de la barra fija cuando
          el enlace de salto mueve el foco. */}
      <main
        className="mx-auto max-w-[1600px] scroll-mt-16 px-5 py-5"
        id="contenido-principal"
        tabIndex={-1}
      >
        {children}
      </main>
    </>
  );
}

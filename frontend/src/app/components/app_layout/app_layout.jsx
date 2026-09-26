import { LoggedUserMenu } from "../../../features/users/components/logged_user_menu/logged_user_menu.jsx";

import { Styles } from "./app_layout.style.js";

import { getNavigationSectionsForUser } from "../../utils/routes.utils.js";

export function AppLayout(props) {
  const {
    children,
    onLogout = () => {},
    user = null,
  } = props;

  return (
    <>
      <Styles.SkipLink href="#contenido-principal">
        Saltar al contenido principal
      </Styles.SkipLink>

      {user ? (
        <Styles.Header>
          <Styles.HeaderContent>
            <Styles.Brand>
              <Styles.BrandDot aria-hidden="true" />
              Tablero de MRs
            </Styles.Brand>

            <nav aria-label="Secciones">
              <Styles.NavigationList>
                {getNavigationSectionsForUser(user).filter((section) => !section.menuOnly).map((section) => {
                  return (
                    <li key={section.id}>
                      <Styles.NavigationLink to={section.path}>
                        {section.label}
                      </Styles.NavigationLink>
                    </li>
                  );
                })}
              </Styles.NavigationList>
            </nav>

            <LoggedUserMenu
              onLogout={onLogout}
              user={user}
            />
          </Styles.HeaderContent>
        </Styles.Header>
      ) : null}

      <Styles.Main id="contenido-principal" tabIndex={-1}>
        {children}
      </Styles.Main>
    </>
  );
}

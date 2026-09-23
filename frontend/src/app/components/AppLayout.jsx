import { NavLink } from "react-router";
import styled from "styled-components";

import { focusRingStyles, visuallyHiddenStyles } from "../constants/styles.consts.js";

import { AccountMenu } from "./AccountMenu.jsx";
import { getNavigationSectionsForUser } from "../utils/routes.utils.js";

const SkipLink = styled.a`
  ${visuallyHiddenStyles}

  &:focus {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 50;
    width: auto;
    height: auto;
    margin: 0;
    padding: 0.5rem 1rem;
    clip: auto;
    border-radius: 0.375rem;
    background: var(--color-accent);
    color: var(--color-bg);
    font-weight: 600;
  }
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
`;

const HeaderContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  max-width: 100rem;
  margin: 0 auto;
  padding: 0.625rem 1.25rem;
  column-gap: 1.25rem;
  row-gap: 0.5rem;
`;

const Brand = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
`;

const BrandDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  flex: none;
  border-radius: 999px;
  background: var(--color-accent);
`;

const NavigationList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const NavigationLink = styled(NavLink)`
  display: block;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;

  &:hover {
    color: var(--color-text-primary);
  }

  &[aria-current="page"] {
    background: var(--color-surface-raised);
    color: var(--color-text-primary);
    font-weight: 600;
  }

  ${focusRingStyles}
`;

const Main = styled.main`
  max-width: 100rem;
  margin: 0 auto;
  padding: 1.25rem;
  scroll-margin-top: 4rem;
`;

export function AppLayout(props) {
  const {
    children,
    onLogout = () => {},
    user = null,
  } = props;

  return (
    <>
      <SkipLink href="#contenido-principal">
        Saltar al contenido principal
      </SkipLink>

      {user ? (
        <Header>
          <HeaderContent>
            <Brand>
              <BrandDot aria-hidden="true" />
              Tablero de MRs
            </Brand>

            <nav aria-label="Secciones">
              <NavigationList>
                {getNavigationSectionsForUser(user).filter((section) => !section.menuOnly).map((section) => {
                  return (
                    <li key={section.id}>
                      <NavigationLink to={section.path}>
                        {section.label}
                      </NavigationLink>
                    </li>
                  );
                })}
              </NavigationList>
            </nav>

            <AccountMenu
              onLogout={onLogout}
              user={user}
            />
          </HeaderContent>
        </Header>
      ) : null}

      <Main id="contenido-principal" tabIndex={-1}>
        {children}
      </Main>
    </>
  );
}

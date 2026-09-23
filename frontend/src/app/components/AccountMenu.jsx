import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import styled, { css } from "styled-components";

import { APP_PATHS } from "../constants/routes.consts.js";
import { focusRingStyles } from "../constants/styles.consts.js";

import { useAccount } from "../../features/accounts/hooks/useAccount.js";
import { isAdmin } from "../../features/accounts/utils/account.utils.js";
import { getUserInitials } from "../../features/users/utils/user.utils.js";

const MenuContainer = styled.div`
  position: relative;
  margin-left: auto;
`;

const MenuTrigger = styled.button`
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.375rem;
  border: 1px solid var(--color-control);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-primary);

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}
`;

const Avatar = styled.span`
  display: flex;
  width: ${({ $large }) => $large ? "2.75rem" : "2rem"};
  height: ${({ $large }) => $large ? "2.75rem" : "2rem"};
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: ${({ $large }) => $large ? "0.875rem" : "0.75rem"};
  font-weight: 700;
`;

const Chevron = styled.svg`
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
  transform: ${({ $open }) => $open ? "rotate(180deg)" : "none"};
  transition: transform 150ms ease;
`;

const MenuPanel = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  width: 18rem;
  margin-top: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.55);
`;

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
`;

const IdentityText = styled.div`
  min-width: 0;
`;

const TruncatedText = styled.p`
  overflow: hidden;
  margin: 0;
  color: ${({ $muted }) => $muted ? "var(--color-text-muted)" : "var(--color-text-primary)"};
  font-size: ${({ $muted }) => $muted ? "0.75rem" : "0.875rem"};
  font-weight: ${({ $muted }) => $muted ? 400 : 600};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AccountDetails = styled.dl`
  margin: 0;
  padding: 0.75rem 1rem;
  border-block: 1px solid var(--color-border-soft);
`;

const AccountTerm = styled.dt`
  color: var(--color-text-faint);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
`;

const AccountName = styled.dd`
  overflow: hidden;
  margin: 0.125rem 0 0;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuActions = styled.div`
  padding: 0.5rem;
`;

const menuActionStyles = css`
  display: flex;
  width: 100%;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 0;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-raised);
  }

  ${focusRingStyles}
`;

const MenuLink = styled(Link)`
  ${menuActionStyles}
`;

const MenuButton = styled.button`
  ${menuActionStyles}
`;

const MenuIcon = styled.svg`
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
`;

export function AccountMenu(props) {
  const {
    onLogout = () => {},
    user = null,
  } = props;

  const { account, loading } = useAccount(user?.accountId ?? null);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) closeMenu();
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      closeMenu();
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  function handleLogout() {
    closeMenu();
    onLogout();
  }

  return (
    <MenuContainer ref={containerRef}>
      <MenuTrigger
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Cerrar" : "Abrir"} menú de cuenta de ${user.displayName}`}
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          setIsOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        <Avatar aria-hidden="true">
          {getUserInitials(user)}
        </Avatar>

        <Chevron
          $open={isOpen}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 20 20"
        >
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </Chevron>
      </MenuTrigger>

      {isOpen ? (
        <MenuPanel
          aria-label="Menú de cuenta"
          id={menuId}
          role="region"
        >
          <Identity>
            <Avatar $large aria-hidden="true">
              {getUserInitials(user)}
            </Avatar>

            <IdentityText>
              <TruncatedText>{user.displayName}</TruncatedText>
              <TruncatedText $muted>{user.email}</TruncatedText>
            </IdentityText>
          </Identity>

          <AccountDetails>
            <AccountTerm>Equipo</AccountTerm>
            <AccountName>
              {account?.name ?? (loading ? "Cargando…" : "No disponible")}
            </AccountName>
          </AccountDetails>

          <MenuActions>
            <MenuLink
              onClick={closeMenu}
              to={APP_PATHS.profile}
            >
              <MenuIcon
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 20 20"
              >
                <path d="m13.5 3.5 3 3L7 16H4v-3L13.5 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </MenuIcon>
              Editar perfil
            </MenuLink>

            <MenuLink
              onClick={closeMenu}
              to={APP_PATHS.account}
            >
              <MenuIcon
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 20 20"
              >
                <path d="M3.5 16.5h13M5 16.5v-9h10v9M7.5 10h1m3 0h1m-5 3h1m3 0h1M4 7.5 10 3l6 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </MenuIcon>
              {isAdmin(user) ? "Editar cuenta" : "Ver cuenta"}
            </MenuLink>

            <MenuButton
              onClick={handleLogout}
              type="button"
            >
              <MenuIcon
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 20 20"
              >
                <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 6.5 16 10l-3.5 3.5M7 10h9" strokeLinecap="round" strokeLinejoin="round" />
              </MenuIcon>
              Cerrar sesión
            </MenuButton>
          </MenuActions>
        </MenuPanel>
      ) : null}
    </MenuContainer>
  );
}

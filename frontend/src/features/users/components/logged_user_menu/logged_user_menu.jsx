import { useEffect, useId, useRef, useState } from "react";

import { useAccount } from "../../../accounts/hooks/useAccount.js";

import { Styles } from "./logged_user_menu.style.js";

import { getUserInitials, isAdmin, } from "../../utils/user.utils.js";

import { APP_PATHS } from "../../../../app/constants/routes.consts.js";

export function LoggedUserMenu(props) {
  const {
    onLogout = () => {},
    user = null,
  } = props;

  const { account, loading } = useAccount(user?.accountId ?? null);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      setIsOpen(false);
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
    setIsOpen(false);
    onLogout();
  }

  return (
    <Styles.MenuContainer ref={containerRef}>
      <Styles.MenuTrigger
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Cerrar" : "Abrir"} menú de cuenta de ${user.displayName}`}
        onClick={() => {
          setIsOpen((prevValue) => !prevValue);
        }}
        ref={triggerRef}
        type="button"
      >
        <Styles.Avatar aria-hidden="true">
          {getUserInitials(user)}
        </Styles.Avatar>

        <Styles.Chevron
          $open={isOpen}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 20 20"
        >
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </Styles.Chevron>
      </Styles.MenuTrigger>

      {isOpen ? (
        <Styles.MenuPanel
          aria-label="Menú de cuenta"
          id={menuId}
          role="region"
        >
          <Styles.Identity>
            <Styles.Avatar $large aria-hidden="true">
              {getUserInitials(user)}
            </Styles.Avatar>

            <Styles.IdentityText>
              <Styles.TruncatedText>
                {user.displayName}
              </Styles.TruncatedText>
              
              <Styles.TruncatedText $muted>
                {user.email}
              </Styles.TruncatedText>
            </Styles.IdentityText>
          </Styles.Identity>

          <Styles.AccountDetails>
            <Styles.AccountTerm>
              Equipo
            </Styles.AccountTerm>
            
            <Styles.AccountName>
              {account?.name ?? (loading ? "Cargando…" : "No disponible")}
            </Styles.AccountName>
          </Styles.AccountDetails>

          <Styles.MenuActions>
            <Styles.MenuLink
              onClick={() => { setIsOpen(false); }}  
              to={APP_PATHS.profile}
            >
              <Styles.MenuIcon
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 20 20"
              >
                <path d="m13.5 3.5 3 3L7 16H4v-3L13.5 3.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </Styles.MenuIcon>
              Editar perfil
            </Styles.MenuLink>

            <Styles.MenuLink
              onClick={() => { setIsOpen(false); }}
              to={APP_PATHS.account}
            >
              <Styles.MenuIcon
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 20 20"
              >
                <path d="M3.5 16.5h13M5 16.5v-9h10v9M7.5 10h1m3 0h1m-5 3h1m3 0h1M4 7.5 10 3l6 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </Styles.MenuIcon>
              {isAdmin(user) ? "Editar cuenta" : "Ver cuenta"}
            </Styles.MenuLink>

            <Styles.MenuButton
              onClick={handleLogout}
              type="button"
            >
              <Styles.MenuIcon
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 20 20"
              >
                <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M12.5 6.5 16 10l-3.5 3.5M7 10h9" strokeLinecap="round" strokeLinejoin="round" />
              </Styles.MenuIcon>
              Cerrar sesión
            </Styles.MenuButton>
          </Styles.MenuActions>
        </Styles.MenuPanel>
      ) : null}
    </Styles.MenuContainer>
  );
}

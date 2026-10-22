import { useEffect, useId, useRef, useState } from "react";

import { useAccount } from "../../../accounts/hooks/useAccount.js";
import { formatAccountName } from "../../../accounts/utils/account.utils.js";

import { LoggedUserMenuPanel } from "../logged_user_menu_panel/logged_user_menu_panel.jsx";
import { UserAvatar } from "../user_avatar/user_avatar.jsx";

import { Styles } from "./logged_user_menu.style.js";

/** Avatar de la barra superior que abre y cierra el menú de cuenta. */
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

  // El menú se cierra al tocar fuera o con Escape, y el foco vuelve al avatar.
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
        onClick={() => setIsOpen((prevValue) => !prevValue)}
        ref={triggerRef}
        type="button"
      >
        <UserAvatar user={user} />

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
        <LoggedUserMenuPanel
          accountName={formatAccountName(account, loading)}
          id={menuId}
          onLogout={handleLogout}
          onNavigate={() => setIsOpen(false)}
          user={user}
        />
      ) : null}
    </Styles.MenuContainer>
  );
}

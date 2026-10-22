import { Styles } from "./menu_icon.style.js";

/** Icono decorativo de una acción del menú de cuenta. */
export function MenuIcon(props) {
  const { path } = props;

  return (
    <Styles.Icon
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      viewBox="0 0 20 20"
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </Styles.Icon>
  );
}

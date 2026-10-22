import { Styles } from "./visibility_icon.style.js";

/** Ojo abierto o tachado que acompaña al control de mostrar u ocultar un valor. */
export function VisibilityIcon(props) {
  const { visible = false } = props;

  if (visible) {
    return (
      <Styles.Icon aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path d="M3 3l18 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path
          d="M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.7 10.7 0 0112 4c5.5 0 9 5.4 9 8a9.8 9.8 0 01-2.1 3.6M6.6 6.6C4.3 8 3 10.4 3 12c0 2.6 3.5 8 9 8a10 10 0 004.1-.9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </Styles.Icon>
    );
  }

  return (
    <Styles.Icon aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 12c0-2.6 3.5-8 9-8s9 5.4 9 8-3.5 8-9 8-9-5.4-9-8z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </Styles.Icon>
  );
}

/**
 * Mantiene la navegación con Tab dentro de un contenedor abierto.
 *
 * @param {KeyboardEvent} event Evento de teclado recibido por el contenedor.
 * @param {HTMLElement|null} container Contenedor que limita el recorrido del foco.
 * @returns {void}
 */
export function keepFocusInside(event, container) {
  if (event.key !== "Tab" || !container) return;

  const controls = [...container.querySelectorAll(
    "a[href], button:not(:disabled), input:not(:disabled)",
  )];

  const firstControl = controls[0];
  const lastControl = controls.at(-1);
  
  if (!firstControl || !lastControl) return;

  if (event.shiftKey && document.activeElement === firstControl) {
    event.preventDefault();
    lastControl.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastControl) {
    event.preventDefault();
    firstControl.focus();
  }
}

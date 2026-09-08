/**
 * Lee las cookies de una petición. Express no las parsea por sí solo y el
 * formato es lo bastante simple como para no sumar una dependencia.
 *
 * @param header Contenido crudo de la cabecera `Cookie`.
 * @returns Diccionario con los valores ya decodificados.
 */
function parseCookieHeader(header) {
  if (!header) return {};

  const cookies = {};

  for (const part of header.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex < 1) continue;

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      // Un valor mal codificado no debe romper la lectura del resto.
      cookies[name] = value;
    }
  }

  return cookies;
}

export { parseCookieHeader };

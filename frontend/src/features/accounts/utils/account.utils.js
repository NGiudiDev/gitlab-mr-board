/**
 * Nombra la cuenta mientras el backend todavía no respondió.
 *
 * @param {{ name?: string } | null | undefined} account Cuenta compartida.
 * @param {boolean} loading `true` mientras la consulta sigue en curso.
 * @returns {string} Nombre de la cuenta, o el estado que corresponda.
 */
export function formatAccountName(account, loading = false) {
  return account?.name ?? (loading ? "Cargando…" : "No disponible");
}

/**
 * Describe la cantidad de integrantes con singular y plural correctos.
 *
 * @param {number} memberCount Personas que comparten la cuenta.
 * @returns {string} Cantidad legible para la interfaz.
 */
export function formatMemberCount(memberCount) {
  return memberCount === 1 ? "1 persona" : `${memberCount} personas`;
}

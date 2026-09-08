// 1. Módulos estándar de Node.js.
import { randomInt } from 'node:crypto';

// El alfabeto excluye los caracteres que se confunden al dictar o copiar un
// código a mano: la O y el 0, la I, la L y el 1.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

/**
 * Genera un código de invitación.
 *
 * `randomInt` usa el generador criptográfico del sistema: el código es lo único
 * que hace falta para sumarse a una cuenta, así que no puede ser predecible.
 *
 * @returns Código de diez caracteres del alfabeto sin ambigüedades.
 */
function generateInviteCode() {
  let code = '';

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return code;
}

/**
 * Normaliza un código escrito por una persona.
 *
 * Se quitan los espacios y guiones que suelen quedar al copiarlo, y se pasa a
 * mayúsculas para que el código no dependa de cómo se tipeó.
 *
 * @param value Valor recibido en el cuerpo de la petición.
 * @returns El código listo para buscar, o una cadena vacía si no vino nada.
 */
function normalizeInviteCode(value) {
  return String(value ?? '').trim().replace(/[\s-]+/g, '').toUpperCase();
}

export { generateInviteCode, normalizeInviteCode };

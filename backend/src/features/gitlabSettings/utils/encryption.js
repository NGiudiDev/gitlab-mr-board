// 1. Módulos estándar de Node.js.
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// AES-256-GCM cifra y autentica en un solo paso: sin la etiqueta correcta el
// descifrado falla, así que un valor manipulado en la base no pasa desapercibido.
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const VERSION = 'v1';

// La sal es fija a propósito: la clave se deriva una sola vez por proceso y
// tiene que dar el mismo resultado en cada arranque para poder descifrar.
const KEY_SALT = 'gitlab-mr-board.secret.v1';
const MINIMUM_SECRET_LENGTH = 32;
const PART_COUNT = 4;

/**
 * Deriva la clave de 32 bytes a partir del secreto configurado.
 *
 * @param secret Valor de `ENCRYPTION_KEY`.
 * @returns Clave lista para AES-256.
 * @throws {Error} Si el secreto no alcanza el largo mínimo.
 */
function deriveKey(secret) {
  if (secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`ENCRYPTION_KEY debe tener al menos ${MINIMUM_SECRET_LENGTH} caracteres.`);
  }

  return scryptSync(secret, KEY_SALT, KEY_LENGTH);
}

/**
 * Arma el cifrador de secretos que guarda el backend.
 *
 * La derivación de la clave ocurre una sola vez, al construirlo: es costosa a
 * propósito y repetirla en cada operación penalizaría cada consulta al tablero.
 *
 * @param secret Valor de `ENCRYPTION_KEY`.
 * @returns Cifrador con `encrypt` y `decrypt`.
 * @throws {Error} Si el secreto no alcanza el largo mínimo.
 */
function createSecretCipher(secret) {
  const key = deriveKey(secret);

  return {
    /**
     * Cifra un texto para guardarlo en la base.
     *
     * @param plainText Valor en claro, por ejemplo el access token de GitLab.
     * @returns Cadena `v1.iv.etiqueta.cifrado` con las partes en base64.
     */
    encrypt(plainText) {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

      return [
        VERSION,
        iv.toString('base64'),
        cipher.getAuthTag().toString('base64'),
        encrypted.toString('base64'),
      ].join('.');
    },

    /**
     * Descifra un valor generado por `encrypt`.
     *
     * @param payload Cadena guardada en la base.
     * @returns El texto original.
     * @throws {Error} Si el formato no corresponde o la clave no es la misma
     * con la que se cifró.
     */
    decrypt(payload) {
      const parts = payload.split('.');

      if (parts.length !== PART_COUNT || parts[0] !== VERSION) {
        throw new Error('El valor cifrado no tiene el formato esperado.');
      }

      const [, ivBase64 = '', authTagBase64 = '', encryptedBase64 = ''] = parts;
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivBase64, 'base64'));
      decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    },
  };
}

export { createSecretCipher, MINIMUM_SECRET_LENGTH };

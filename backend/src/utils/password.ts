// 1. Módulos estándar de Node.js.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

import type { ScryptOptions } from 'node:crypto';

// Parámetros de scrypt. Se guardan junto al hash para poder endurecerlos más
// adelante sin invalidar las contraseñas ya almacenadas.
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const ALGORITHM = 'scrypt';

const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Deriva la clave con los parámetros indicados.
 *
 * @param password Contraseña en texto plano.
 * @param salt Sal en formato binario.
 * @param cost Parámetro `N` de scrypt.
 * @param blockSize Parámetro `r` de scrypt.
 * @param parallelization Parámetro `p` de scrypt.
 * @returns Clave derivada de `KEY_LENGTH` bytes.
 */
async function deriveKey(
  password: string,
  salt: Buffer,
  cost: number,
  blockSize: number,
  parallelization: number,
): Promise<Buffer> {
  // scrypt necesita memoria proporcional a 128 * N * r; el máximo por omisión
  // (32 MB) no alcanza para los parámetros elegidos.
  const options: ScryptOptions = { N: cost, r: blockSize, p: parallelization, maxmem: 256 * cost * blockSize };

  return await new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

/**
 * Genera el hash almacenable de una contraseña.
 *
 * @param password Contraseña en texto plano.
 * @returns Cadena `scrypt$N$r$p$sal$clave` con los valores en hexadecimal.
 * @throws {Error} Si la contraseña no alcanza el largo mínimo.
 */
async function hashPassword(password: string): Promise<string> {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${MINIMUM_PASSWORD_LENGTH} caracteres.`);
  }

  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, COST, BLOCK_SIZE, PARALLELIZATION);

  return [
    ALGORITHM,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('hex'),
    key.toString('hex'),
  ].join('$');
}

/**
 * Verifica una contraseña contra un hash almacenado.
 *
 * @param password Contraseña en texto plano a validar.
 * @param storedHash Hash generado por `hashPassword`.
 * @returns `true` sólo si coinciden; `false` ante cualquier hash inválido.
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [, cost, blockSize, parallelization, saltHex, keyHex] = parts as [
    string, string, string, string, string, string,
  ];
  const parsedCost = Number.parseInt(cost, 10);
  const parsedBlockSize = Number.parseInt(blockSize, 10);
  const parsedParallelization = Number.parseInt(parallelization, 10);

  if (!parsedCost || !parsedBlockSize || !parsedParallelization) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  if (salt.length === 0 || expectedKey.length === 0) return false;

  try {
    const key = await deriveKey(password, salt, parsedCost, parsedBlockSize, parsedParallelization);

    // La comparación es de tiempo constante para no filtrar el prefijo correcto.
    return key.length === expectedKey.length && timingSafeEqual(key, expectedKey);
  } catch (error: unknown) {
    console.error('No se pudo verificar la contraseña:', error);
    return false;
  }
}

export { hashPassword, MINIMUM_PASSWORD_LENGTH, verifyPassword };

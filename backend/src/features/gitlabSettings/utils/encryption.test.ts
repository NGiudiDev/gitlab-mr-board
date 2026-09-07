// 2. Dependencias externas.
import { describe, expect, it } from 'vitest';

// 5. Módulos de constantes.
import { TEST_ENCRYPTION_KEY, TEST_TOKEN } from '../../../../test/constants.js';

// 7. Imports relativos restantes.
import { createSecretCipher, MINIMUM_SECRET_LENGTH } from './encryption.js';

const OTHER_KEY = 'otra-clave-de-cifrado-para-los-test';

describe('createSecretCipher', () => {
  it('rechaza una clave más corta que el mínimo', () => {
    expect(() => createSecretCipher('a'.repeat(MINIMUM_SECRET_LENGTH - 1)))
      .toThrow(/ENCRYPTION_KEY/);
  });

  it('acepta una clave del largo mínimo', () => {
    expect(() => createSecretCipher('a'.repeat(MINIMUM_SECRET_LENGTH))).not.toThrow();
  });
});

describe('encrypt', () => {
  it('devuelve el texto original al descifrarlo', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);

    expect(cipher.decrypt(cipher.encrypt(TEST_TOKEN))).toBe(TEST_TOKEN);
  });

  it('no deja el valor original a la vista', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);

    expect(cipher.encrypt(TEST_TOKEN)).not.toContain(TEST_TOKEN);
  });

  it('produce un resultado distinto cada vez, porque el vector es aleatorio', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);

    expect(cipher.encrypt(TEST_TOKEN)).not.toBe(cipher.encrypt(TEST_TOKEN));
  });

  it('conserva los caracteres no ASCII', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);
    const value = 'contraseña con acentos y símbolos: ñÁ€';

    expect(cipher.decrypt(cipher.encrypt(value))).toBe(value);
  });
});

describe('decrypt', () => {
  it('falla con una clave distinta de la que cifró', () => {
    const encrypted = createSecretCipher(TEST_ENCRYPTION_KEY).encrypt(TEST_TOKEN);

    expect(() => createSecretCipher(OTHER_KEY).decrypt(encrypted)).toThrow();
  });

  it('falla si el valor guardado fue alterado', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);
    const [version, iv, authTag, encrypted] = cipher.encrypt(TEST_TOKEN).split('.') as [
      string, string, string, string,
    ];
    const tampered = [version, iv, authTag, Buffer.from('otro valor').toString('base64')].join('.');

    expect(() => cipher.decrypt(tampered)).toThrow();
  });

  it('rechaza un formato que no reconoce', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);

    expect(() => cipher.decrypt('texto suelto')).toThrow(/formato esperado/);
  });

  it('rechaza una versión desconocida', () => {
    const cipher = createSecretCipher(TEST_ENCRYPTION_KEY);
    const encrypted = cipher.encrypt(TEST_TOKEN).replace(/^v1\./, 'v2.');

    expect(() => cipher.decrypt(encrypted)).toThrow(/formato esperado/);
  });
});

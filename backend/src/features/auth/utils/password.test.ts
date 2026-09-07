// 2. Dependencias externas.
import { afterEach, describe, expect, it, vi } from 'vitest';

// 7. Imports relativos restantes.
import { hashPassword, MINIMUM_PASSWORD_LENGTH, verifyPassword } from './password.js';

const PASSWORD = 'una-contrasena-larga';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hashPassword', () => {
  it('devuelve el algoritmo y los parámetros junto al hash', async () => {
    const hash = await hashPassword(PASSWORD);
    const [algorithm, cost, blockSize, parallelization, salt, key] = hash.split('$');

    expect(algorithm).toBe('scrypt');
    expect(Number(cost)).toBeGreaterThan(0);
    expect(Number(blockSize)).toBeGreaterThan(0);
    expect(Number(parallelization)).toBeGreaterThan(0);
    expect(salt).toMatch(/^[0-9a-f]+$/);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it('nunca guarda la contraseña en claro', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash).not.toContain(PASSWORD);
  });

  it('usa una sal distinta en cada llamada', async () => {
    const [first, second] = await Promise.all([hashPassword(PASSWORD), hashPassword(PASSWORD)]);

    expect(first).not.toBe(second);
  });

  it('rechaza una contraseña más corta que el mínimo', async () => {
    const short = 'a'.repeat(MINIMUM_PASSWORD_LENGTH - 1);

    await expect(hashPassword(short)).rejects.toThrow(/al menos 8 caracteres/);
  });
});

describe('verifyPassword', () => {
  it('acepta la contraseña correcta', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(await verifyPassword('otra-contrasena', hash)).toBe(false);
  });

  it('rechaza un hash con formato desconocido', async () => {
    expect(await verifyPassword(PASSWORD, 'sin-formato')).toBe(false);
    expect(await verifyPassword(PASSWORD, 'bcrypt$16384$8$1$aa$bb')).toBe(false);
  });

  it('rechaza un hash con parámetros no numéricos', async () => {
    expect(await verifyPassword(PASSWORD, 'scrypt$x$8$1$aa$bb')).toBe(false);
  });

  it('rechaza un hash sin sal o sin clave', async () => {
    expect(await verifyPassword(PASSWORD, 'scrypt$16384$8$1$$bb')).toBe(false);
    expect(await verifyPassword(PASSWORD, 'scrypt$16384$8$1$aa$')).toBe(false);
  });

  it('devuelve false y loguea cuando la derivación falla', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Un `N` que no es potencia de dos hace fallar a scrypt.
    const invalidCost = 'scrypt$3$8$1$aabb$ccdd';

    expect(await verifyPassword(PASSWORD, invalidCost)).toBe(false);
    expect(logged).toHaveBeenCalled();
  });
});

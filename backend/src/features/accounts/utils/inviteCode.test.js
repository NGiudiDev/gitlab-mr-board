// 2. Dependencias externas.
import { describe, expect, it } from 'vitest';

// 6. Imports relativos restantes.
import { generateInviteCode, normalizeInviteCode } from './inviteCode.js';

describe('generateInviteCode', () => {
  it('genera diez caracteres del alfabeto sin ambigüedades', () => {
    const code = generateInviteCode();

    expect(code).toHaveLength(10);
    // Sin O, 0, I, L ni 1: son los que se confunden al dictar o copiar.
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/);
  });

  it('no repite el código entre llamadas', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));

    expect(codes.size).toBe(20);
  });
});

describe('normalizeInviteCode', () => {
  it('pasa a mayúsculas y descarta espacios y guiones', () => {
    expect(normalizeInviteCode('  abcd-efgh 23 ')).toBe('ABCDEFGH23');
  });

  it('devuelve una cadena vacía cuando no vino nada', () => {
    expect(normalizeInviteCode(undefined)).toBe('');
    expect(normalizeInviteCode(null)).toBe('');
    expect(normalizeInviteCode('   ')).toBe('');
  });
});

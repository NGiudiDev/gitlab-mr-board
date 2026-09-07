// 2. Dependencias externas.
import { describe, expect, it } from 'vitest';

// 7. Imports relativos restantes.
import { parseCookieHeader } from './cookies.js';

describe('parseCookieHeader', () => {
  it('devuelve un objeto vacío cuando no hay cabecera', () => {
    expect(parseCookieHeader(undefined)).toEqual({});
    expect(parseCookieHeader('')).toEqual({});
  });

  it('separa varias cookies ignorando los espacios', () => {
    expect(parseCookieHeader('a=1; b=2;c=3')).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('conserva los signos igual que forman parte del valor', () => {
    expect(parseCookieHeader('token=abc==')).toEqual({ token: 'abc==' });
  });

  it('decodifica los valores escapados', () => {
    expect(parseCookieHeader('nombre=Ana%20P%C3%A9rez')).toEqual({ nombre: 'Ana Pérez' });
  });

  it('devuelve el valor crudo cuando la codificación es inválida', () => {
    expect(parseCookieHeader('roto=%E0%A4%A')).toEqual({ roto: '%E0%A4%A' });
  });

  it('descarta los fragmentos sin nombre o sin signo igual', () => {
    expect(parseCookieHeader('suelto; =sinNombre; valida=1')).toEqual({ valida: '1' });
  });
});

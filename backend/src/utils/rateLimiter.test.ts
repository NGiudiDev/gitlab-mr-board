import { describe, expect, it } from 'vitest';

import RateLimiter from './rateLimiter.js';

/** Promesa que se resuelve desde fuera, para controlar el orden de ejecución. */
function createDeferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolveFn, rejectFn) => {
    resolve = resolveFn;
    reject = rejectFn;
  });
  return { promise, resolve, reject };
}

describe('RateLimiter', () => {
  it('devuelve el resultado de la operación', async () => {
    const limiter = new RateLimiter(2);

    await expect(limiter.run(async () => 'listo')).resolves.toBe('listo');
  });

  it('no ejecuta más operaciones que el máximo concurrente', async () => {
    const limiter = new RateLimiter(2);
    const gates = [createDeferred(), createDeferred(), createDeferred()];
    let started = 0;

    const operations = gates.map((gate) => limiter.run(async () => {
      started++;
      await gate.promise;
      return started;
    }));

    await Promise.resolve();
    expect(started).toBe(2);

    gates[0]?.resolve();
    await operations[0];
    expect(started).toBe(3);

    gates[1]?.resolve();
    gates[2]?.resolve();
    await Promise.all(operations);
  });

  it('respeta el orden de llegada de la cola', async () => {
    const limiter = new RateLimiter(1);
    const order: number[] = [];

    const operations = [1, 2, 3].map((id) => limiter.run(async () => {
      order.push(id);
    }));

    await Promise.all(operations);
    expect(order).toEqual([1, 2, 3]);
  });

  it('libera el turno aunque la operación falle', async () => {
    const limiter = new RateLimiter(1);

    await expect(limiter.run(async () => { throw new Error('falló la llamada'); }))
      .rejects.toThrow('falló la llamada');

    await expect(limiter.run(async () => 'siguiente')).resolves.toBe('siguiente');
  });

  it('permite ejecutar todas las operaciones encoladas', async () => {
    const limiter = new RateLimiter(3);
    const total = 12;

    const results = await Promise.all(
      Array.from({ length: total }, (_value, index) => limiter.run(async () => index)),
    );

    expect(results).toEqual(Array.from({ length: total }, (_value, index) => index));
  });
});

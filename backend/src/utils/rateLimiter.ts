import type { QueueResolver } from '../types.js';

class RateLimiter {
  private activeOperations = 0;
  private readonly waitingQueue: QueueResolver[] = [];

  constructor(private readonly maxConcurrent = 6) {}

  /** Reserva un turno inmediato o espera en orden de llegada. */
  private acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeOperations < this.maxConcurrent) {
        this.activeOperations++;
        resolve();
        return;
      }

      this.waitingQueue.push(resolve);
    });
  }

  /** Entrega el turno a la siguiente operación o libera capacidad. */
  private release(): void {
    const nextOperation = this.waitingQueue.shift();
    if (nextOperation) {
      nextOperation();
      return;
    }

    this.activeOperations--;
  }

  /** Ejecuta una operación cuando hay capacidad y siempre libera su turno. */
  async run<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await operation();
    } finally {
      this.release();
    }
  }
}

export default RateLimiter;

type QueueResolver = () => void;

class RateLimiter {
  private running = 0;
  private readonly queue: QueueResolver[] = [];

  constructor(private readonly maxConcurrent = 6) {}

  private acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.running < this.maxConcurrent) {
        this.running++;
        resolve();
        return;
      }

      this.queue.push(resolve);
    });
  }

  private release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
      return;
    }

    this.running--;
  }

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

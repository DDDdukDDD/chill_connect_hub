/**
 * Lightweight Async Mutex (Mutual Exclusion Lock)
 * Serializes critical write operations (such as atomic seat bookings or disk persistence)
 * to prevent concurrent race conditions and file I/O corruption.
 */
export class AsyncMutex {
  private queue: Array<(release: () => void) => void> = [];
  private locked: boolean = false;

  public async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.locked = true;
        resolve(() => this.release());
      };

      if (!this.locked) {
        execute();
      } else {
        this.queue.push(() => execute());
      }
    });
  }

  private release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next(() => this.release());
    } else {
      this.locked = false;
    }
  }

  /**
   * Helper to run an async block safely within the lock
   */
  public async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

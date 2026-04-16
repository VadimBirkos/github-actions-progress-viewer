export class Poller {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private active = false;
  private intervalMs: number;
  private callback: (() => Promise<void>) | null = null;

  constructor(intervalMs: number) {
    this.intervalMs = intervalMs;
  }

  start(callback: () => Promise<void>): void {
    this.stop();
    this.active = true;
    this.callback = callback;
    this.tick();
  }

  stop(): void {
    this.active = false;
    this.callback = null;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  setIntervalMs(ms: number): void {
    this.intervalMs = ms;
  }

  private tick(): void {
    if (!this.active || !this.callback) return;
    const cb = this.callback;
    cb().catch(() => undefined).finally(() => {
      if (this.active) {
        this.timerId = setTimeout(() => this.tick(), this.intervalMs);
      }
    });
  }
}

'use client';

import type { Locale } from '@inkwell/shared';

/** Debounced crisis check in a worker. The page only learns "hit" or "no hit". */
export class CrisisScanner {
  private worker: Worker | null = null;
  private counter = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly pending = new Map<number, (hit: boolean) => void>();

  private ensure(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('../../workers/crisis.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener('message', (event: MessageEvent<{ id: number; hit: boolean }>) => {
      const resolve = this.pending.get(event.data.id);
      if (resolve) {
        this.pending.delete(event.data.id);
        resolve(event.data.hit);
      }
    });
    return this.worker;
  }

  scan(text: string, locale: Locale): Promise<boolean> {
    const worker = this.ensure();
    const id = (this.counter += 1);
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      worker.postMessage({ id, text, locale });
    });
  }

  /** Scans at most every 600 ms while typing. */
  scanDebounced(text: string, locale: Locale, onResult: (hit: boolean) => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.scan(text, locale).then(onResult);
    }, 600);
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = null;
  }
}

'use client';

import type { CryptoEnvelope, CryptoRequest, CryptoResponse, EncryptedPayload } from './protocol';

/** Thin RPC over the crypto worker. One worker per tab, created lazily. */
class CryptoClient {
  private worker: Worker | null = null;
  private counter = 0;
  private readonly pending = new Map<number, (response: CryptoResponse) => void>();

  private ensure(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('../../workers/crypto.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener(
      'message',
      (event: MessageEvent<CryptoEnvelope<CryptoResponse>>) => {
        const resolve = this.pending.get(event.data.id);
        if (resolve) {
          this.pending.delete(event.data.id);
          resolve(event.data.body);
        }
      },
    );
    return this.worker;
  }

  private call<T extends CryptoResponse['type']>(
    request: CryptoRequest & { type: T },
  ): Promise<Extract<CryptoResponse, { type: T }>> {
    const worker = this.ensure();
    const id = (this.counter += 1);
    return new Promise((resolve, reject) => {
      this.pending.set(id, (response) => {
        if (response.type === 'error') reject(new CryptoError(response.message));
        else resolve(response as Extract<CryptoResponse, { type: T }>);
      });
      worker.postMessage({ id, body: request } satisfies CryptoEnvelope<CryptoRequest>);
    });
  }

  async hasKey(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return (await this.call({ type: 'hasKey' })).value;
  }

  async generateMnemonic(): Promise<string> {
    return (await this.call({ type: 'generateMnemonic' })).mnemonic;
  }

  async validateMnemonic(mnemonic: string): Promise<boolean> {
    return (await this.call({ type: 'validateMnemonic', mnemonic })).valid;
  }

  async setupFromMnemonic(mnemonic: string): Promise<void> {
    await this.call({ type: 'setupFromMnemonic', mnemonic });
  }

  async encrypt(plaintext: string): Promise<EncryptedPayload> {
    return (await this.call({ type: 'encrypt', plaintext })).payload;
  }

  async decrypt(payload: EncryptedPayload): Promise<string> {
    return (await this.call({ type: 'decrypt', payload })).plaintext;
  }

  async revealMnemonic(): Promise<string> {
    return (await this.call({ type: 'revealMnemonic' })).mnemonic;
  }

  async clear(): Promise<void> {
    await this.call({ type: 'clear' });
  }
}

export class CryptoError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'CryptoError';
  }
}

export const cryptoClient = new CryptoClient();

/// <reference lib="webworker" />
import { del, get, set } from 'idb-keyval';

import {
  decryptWithMaster,
  deriveMasterKey,
  encryptWithMaster,
  isValidMnemonic,
  newMnemonic,
  unwrapSeed,
  wrapSeed,
} from '@/features/crypto/primitives';

import type { CryptoEnvelope, CryptoRequest, CryptoResponse } from '@/features/crypto/protocol';

/**
 * All encryption runs here so the interface never blocks and the master key
 * never touches page scripts. The key is a non-extractable CryptoKey persisted
 * in IndexedDB; it survives reloads but not clearing site data.
 */
const KEY_ID = 'inkwell.master-key.v1';
const SEED_ID = 'inkwell.wrapped-seed.v1';
const scope = self as unknown as DedicatedWorkerGlobalScope;

let cached: CryptoKey | null = null;

async function masterKey(): Promise<CryptoKey | null> {
  if (cached) return cached;
  const stored = await get<CryptoKey>(KEY_ID);
  cached = stored ?? null;
  return cached;
}

async function handle(request: CryptoRequest): Promise<CryptoResponse> {
  switch (request.type) {
    case 'hasKey':
      return { type: 'hasKey', value: (await masterKey()) !== null };
    case 'generateMnemonic':
      return { type: 'generateMnemonic', mnemonic: newMnemonic() };
    case 'validateMnemonic':
      return { type: 'validateMnemonic', valid: isValidMnemonic(request.mnemonic) };
    case 'setupFromMnemonic': {
      if (!isValidMnemonic(request.mnemonic)) return { type: 'error', message: 'MNEMONIC_INVALID' };
      const key = await deriveMasterKey(request.mnemonic, scope.crypto.subtle);
      await set(KEY_ID, key);
      await set(SEED_ID, await wrapSeed(request.mnemonic, key, scope.crypto.subtle));
      cached = key;
      return { type: 'setupFromMnemonic', ok: true };
    }
    case 'encrypt': {
      const key = await masterKey();
      if (!key) return { type: 'error', message: 'NO_KEY' };
      return {
        type: 'encrypt',
        payload: await encryptWithMaster(request.plaintext, key, scope.crypto.subtle),
      };
    }
    case 'decrypt': {
      const key = await masterKey();
      if (!key) return { type: 'error', message: 'NO_KEY' };
      try {
        return {
          type: 'decrypt',
          plaintext: await decryptWithMaster(request.payload, key, scope.crypto.subtle),
        };
      } catch {
        return { type: 'error', message: 'DECRYPT_FAILED' };
      }
    }
    case 'revealMnemonic': {
      const key = await masterKey();
      const wrapped = await get<string>(SEED_ID);
      if (!key || !wrapped) return { type: 'error', message: 'NO_KEY' };
      return {
        type: 'revealMnemonic',
        mnemonic: await unwrapSeed(wrapped, key, scope.crypto.subtle),
      };
    }
    case 'clear':
      await del(KEY_ID);
      await del(SEED_ID);
      cached = null;
      return { type: 'clear', ok: true };
  }
}

scope.addEventListener('message', (event: MessageEvent<CryptoEnvelope<CryptoRequest>>) => {
  const { id, body } = event.data;
  void handle(body)
    .catch((error: unknown): CryptoResponse => ({
      type: 'error',
      message: error instanceof Error ? error.message : 'UNKNOWN',
    }))
    .then((response) =>
      scope.postMessage({ id, body: response } satisfies CryptoEnvelope<CryptoResponse>),
    );
});

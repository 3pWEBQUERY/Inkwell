import {
  entropyToMnemonic,
  generateMnemonic,
  mnemonicToEntropy,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

import type { EncryptedPayload } from './protocol';

/**
 * Pure Web Crypto primitives, shared by the worker and the unit tests.
 *
 * Seed (128 bit, shown as 12 BIP39 words)
 *   → HKDF-SHA-256 → master key (AES-KW 256, non-extractable)
 *   → wraps one AES-256-GCM content key per entry.
 * A key rotation re-wraps content keys; the texts are never re-encrypted.
 */
const HKDF_SALT = new TextEncoder().encode('inkwell/master-key/v1');
const HKDF_INFO = new TextEncoder().encode('aes-kw-256');

export function newMnemonic(): string {
  return generateMnemonic(wordlist, 128);
}

export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(normalizeMnemonic(mnemonic), wordlist);
}

export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().split(/\s+/u).join(' ');
}

export async function deriveMasterKey(mnemonic: string, subtle: SubtleCrypto): Promise<CryptoKey> {
  const entropy = owned(mnemonicToEntropy(normalizeMnemonic(mnemonic), wordlist));
  const ikm = await subtle.importKey('raw', entropy, 'HKDF', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: HKDF_SALT, info: HKDF_INFO },
    ikm,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

export async function encryptWithMaster(
  plaintext: string,
  master: CryptoKey,
  subtle: SubtleCrypto,
): Promise<EncryptedPayload> {
  const contentKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    contentKey,
    owned(new TextEncoder().encode(plaintext)),
  );
  const wrappedKey = await subtle.wrapKey('raw', contentKey, master, 'AES-KW');
  return {
    ciphertext: toBase64url(new Uint8Array(ciphertext)),
    nonce: toBase64url(nonce),
    wrappedKey: toBase64url(new Uint8Array(wrappedKey)),
  };
}

export async function decryptWithMaster(
  payload: EncryptedPayload,
  master: CryptoKey,
  subtle: SubtleCrypto,
): Promise<string> {
  const contentKey = await subtle.unwrapKey(
    'raw',
    fromBase64url(payload.wrappedKey),
    master,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64url(payload.nonce) },
    contentKey,
    fromBase64url(payload.ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

/**
 * The seed itself is kept wrapped by the master key so the recovery code can be
 * shown again later (after a fresh sign-in). Same protection as content keys.
 */
export async function wrapSeed(
  mnemonic: string,
  master: CryptoKey,
  subtle: SubtleCrypto,
): Promise<string> {
  const entropy = owned(mnemonicToEntropy(normalizeMnemonic(mnemonic), wordlist));
  const seedKey = await subtle.importKey('raw', entropy, { name: 'AES-GCM', length: 128 }, true, [
    'encrypt',
  ]);
  const wrapped = await subtle.wrapKey('raw', seedKey, master, 'AES-KW');
  return toBase64url(new Uint8Array(wrapped));
}

export async function unwrapSeed(
  wrapped: string,
  master: CryptoKey,
  subtle: SubtleCrypto,
): Promise<string> {
  const seedKey = await subtle.unwrapKey(
    'raw',
    fromBase64url(wrapped),
    master,
    'AES-KW',
    { name: 'AES-GCM', length: 128 },
    true,
    ['encrypt'],
  );
  const entropy = new Uint8Array(await subtle.exportKey('raw', seedKey));
  return entropyToMnemonic(entropy, wordlist);
}

export function toBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const padded =
    value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Copies bytes into an ArrayBuffer-backed view, which is what Web Crypto accepts. */
function owned(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  return copy;
}

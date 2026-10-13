import { webcrypto } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  decryptWithMaster,
  deriveMasterKey,
  encryptWithMaster,
  fromBase64url,
  isValidMnemonic,
  newMnemonic,
  toBase64url,
  unwrapSeed,
  wrapSeed,
} from '@/features/crypto/primitives';

const subtle = webcrypto.subtle as unknown as SubtleCrypto;

describe('crypto primitives', () => {
  it('generates valid 12-word codes', () => {
    const mnemonic = newMnemonic();
    expect(mnemonic.split(' ')).toHaveLength(12);
    expect(isValidMnemonic(mnemonic)).toBe(true);
    expect(isValidMnemonic('not a valid code at all')).toBe(false);
    expect(isValidMnemonic(`  ${mnemonic.toUpperCase()}  `)).toBe(true);
  });

  it('round-trips text through a wrapped content key', async () => {
    const mnemonic = newMnemonic();
    const master = await deriveMasterKey(mnemonic, subtle);
    const payload = await encryptWithMaster(
      'Nachts ist es still. **Fett** und *kursiv*.',
      master,
      subtle,
    );
    expect(payload.ciphertext).not.toContain('Nachts');
    expect(await decryptWithMaster(payload, master, subtle)).toBe(
      'Nachts ist es still. **Fett** und *kursiv*.',
    );
  });

  it('derives the same key from the same words and a different one otherwise', async () => {
    const mnemonic = newMnemonic();
    const a = await deriveMasterKey(mnemonic, subtle);
    const b = await deriveMasterKey(mnemonic, subtle);
    const other = await deriveMasterKey(newMnemonic(), subtle);
    const payload = await encryptWithMaster('secret', a, subtle);
    expect(await decryptWithMaster(payload, b, subtle)).toBe('secret');
    await expect(decryptWithMaster(payload, other, subtle)).rejects.toThrow();
  });

  it('keeps the master key non-extractable', async () => {
    const master = await deriveMasterKey(newMnemonic(), subtle);
    expect(master.extractable).toBe(false);
    expect(master.usages).toEqual(expect.arrayContaining(['wrapKey', 'unwrapKey']));
  });

  it('wraps the seed so the recovery code can be shown again', async () => {
    const mnemonic = newMnemonic();
    const master = await deriveMasterKey(mnemonic, subtle);
    const wrapped = await wrapSeed(mnemonic, master, subtle);
    expect(await unwrapSeed(wrapped, master, subtle)).toBe(mnemonic);
  });

  it('base64url round-trips bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(Array.from(fromBase64url(toBase64url(bytes)))).toEqual(Array.from(bytes));
    expect(toBase64url(bytes)).not.toMatch(/[+/=]/);
  });
});

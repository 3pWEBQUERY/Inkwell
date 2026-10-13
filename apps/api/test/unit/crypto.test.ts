import { describe, expect, it } from 'vitest';

import {
  hmac,
  randomSixDigitCode,
  randomToken,
  safeEqual,
  scryptHash,
  scryptVerify,
  sha256,
} from '../../src/lib/crypto.js';

describe('crypto helpers', () => {
  it('produces six-digit codes with leading zeros', () => {
    for (let i = 0; i < 200; i += 1) expect(randomSixDigitCode()).toMatch(/^\d{6}$/);
  });

  it('produces url-safe tokens of the expected entropy', () => {
    const token = randomToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(randomToken(32)).not.toBe(token);
  });

  it('hashes deterministically', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abd'));
    expect(hmac('k', 'a@b.ch')).toBe(hmac('k', 'a@b.ch'));
    expect(hmac('k', 'a@b.ch')).not.toBe(hmac('k2', 'a@b.ch'));
  });

  it('verifies scrypt hashes and rejects wrong values', async () => {
    const stored = await scryptHash('123456');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(await scryptVerify('123456', stored)).toBe(true);
    expect(await scryptVerify('123457', stored)).toBe(false);
    expect(await scryptVerify('123456', 'bogus')).toBe(false);
  });

  it('compares in constant time without throwing on length mismatch', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

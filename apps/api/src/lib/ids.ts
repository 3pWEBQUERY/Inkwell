import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function toBase36(value: number, length: number): string {
  return value.toString(36).padStart(length, '0').slice(-length);
}

/**
 * 24-character, URL-safe, roughly time-ordered identifiers: 9 chars of
 * millisecond time, 15 chars of randomness (~77 bits). Sortable by creation
 * time, which keeps cursor pagination simple and index-friendly.
 */
export function newId(now: number = Date.now()): string {
  const bytes = randomBytes(15);
  let random = '';
  for (const byte of bytes) random += ALPHABET[byte % 36] ?? '0';
  return toBase36(now, 9) + random;
}

export function isId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-z]{24}$/.test(value);
}

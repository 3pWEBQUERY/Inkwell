import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

const SCRYPT_PARAMS: ScryptOptions = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SCRYPT_KEY_LENGTH = 32;

function scryptAsync(value: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(value, salt, length, SCRYPT_PARAMS, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/** A high-entropy opaque token (session, export, challenge), base64url. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Six-digit code, uniformly random, with leading zeros. */
export function randomSixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * High-entropy tokens are looked up by their SHA-256; a leaked table of hashes is
 * useless without the original 256-bit token, and the lookup stays fast.
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

/** Keyed hash for e-mail lookup, so the mail column can be indexed without storing it twice in clear. */
export function hmac(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/**
 * Low-entropy secrets (six-digit codes) are stored with scrypt so a database
 * leak does not allow offline brute force within the code's lifetime.
 */
export async function scryptHash(value: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(value, salt, SCRYPT_KEY_LENGTH);
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function scryptVerify(value: string, stored: string): Promise<boolean> {
  const [scheme, saltPart, hashPart] = stored.split('$');
  if (scheme !== 'scrypt' || !saltPart || !hashPart) return false;
  const salt = Buffer.from(saltPart, 'base64url');
  const expected = Buffer.from(hashPart, 'base64url');
  const derived = await scryptAsync(value, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

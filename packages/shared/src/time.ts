import { EXPIRY_HOURS, type Expiry } from './constants.js';

export function expiresAtFor(expiry: Expiry, now: Date = new Date()): Date | null {
  const hours = EXPIRY_HOURS[expiry];
  if (hours === null) return null;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export function isExpired(expiresAt: Date | string | null, now: Date = new Date()): boolean {
  if (expiresAt === null) return false;
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return date.getTime() <= now.getTime();
}

/** Whole hours until expiry, never negative; null when there is no expiry. */
export function hoursUntil(expiresAt: Date | string | null, now: Date = new Date()): number | null {
  if (expiresAt === null) return null;
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 3_600_000));
}

export function isWithinEditWindow(
  createdAt: Date | string,
  windowMinutes: number,
  now: Date = new Date(),
): boolean {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return now.getTime() - date.getTime() <= windowMinutes * 60_000;
}

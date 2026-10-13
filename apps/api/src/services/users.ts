import { and, eq, isNull } from 'drizzle-orm';

import { LIMITS, type Locale, type Me, type UserSettings } from '@inkwell/shared';

import { passkeys, users, type UserRow } from '../db/schema.js';
import { hmac } from '../lib/crypto.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';

import type { DbOrTx } from '../db/client.js';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultVisibility: 'private',
  defaultExpiry: 'none',
  fontSize: 19,
  editorFont: 'serif',
  theme: 'system',
  reduceMotion: 'system',
  dailyFeedbackDigest: false,
  commentNotifications: true,
};

const RESERVED_PSEUDONYMS = new Set([
  'admin',
  'administrator',
  'anonym',
  'anonymous',
  'anonyme',
  'anonimo',
  'inkwell',
  'moderation',
  'moderator',
  'support',
  'hilfe',
  'help',
  'team',
  'system',
  'root',
  'me',
  'settings',
]);

export function emailHash(secret: string, email: string): string {
  return hmac(secret, email.trim().toLowerCase());
}

export async function findUserByEmail(
  db: DbOrTx,
  secret: string,
  email: string,
): Promise<UserRow | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.emailHash, emailHash(secret, email)))
    .limit(1);
  return row ?? null;
}

export async function findUserByPseudonym(db: DbOrTx, pseudonym: string): Promise<UserRow | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.pseudonym, pseudonym.toLowerCase()), isNull(users.deletedAt)))
    .limit(1);
  return row ?? null;
}

export async function isPseudonymAvailable(
  db: DbOrTx,
  pseudonym: string,
  exceptUserId?: string,
): Promise<boolean> {
  const lower = pseudonym.toLowerCase();
  if (RESERVED_PSEUDONYMS.has(lower)) return false;
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.pseudonym, lower))
    .limit(1);
  if (!row) return true;
  return row.id === exceptUserId;
}

/** A placeholder pseudonym until onboarding sets the real one. Never shown. */
function provisionalPseudonym(id: string): string {
  return `new.${id.slice(-12)}`;
}

export async function createUser(
  db: DbOrTx,
  secret: string,
  input: { email: string; locale: Locale; appleSub?: string },
): Promise<UserRow> {
  const id = newId();
  const [row] = await db
    .insert(users)
    .values({
      id,
      email: input.email.trim().toLowerCase(),
      emailHash: emailHash(secret, input.email),
      appleSub: input.appleSub ?? null,
      pseudonym: provisionalPseudonym(id),
      locale: input.locale,
      roomLocales: [input.locale],
      settings: DEFAULT_SETTINGS,
      avatar: `shape:${pickShape(id)}`,
    })
    .returning();
  if (!row) throw new ApiError('INTERNAL');
  return row;
}

const SHAPES = ['leaf', 'stone', 'wave', 'moon', 'seed', 'cloud', 'drop', 'feather'];

function pickShape(id: string): string {
  const code = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const shape = SHAPES[code % SHAPES.length] ?? 'leaf';
  const tone = (code % 6) + 1;
  return `${shape}-${tone}`;
}

export async function changePseudonym(
  db: DbOrTx,
  user: UserRow,
  pseudonym: string,
  now = new Date(),
): Promise<void> {
  const lower = pseudonym.toLowerCase();
  if (lower === user.pseudonym) return;
  if (user.pseudonymChangedAt) {
    const lockUntil =
      user.pseudonymChangedAt.getTime() + LIMITS.pseudonymChangeLockDays * 86_400_000;
    if (lockUntil > now.getTime()) {
      throw new ApiError('PSEUDONYM_CHANGE_LOCKED', { until: new Date(lockUntil).toISOString() });
    }
  }
  if (!(await isPseudonymAvailable(db, lower, user.id))) throw new ApiError('PSEUDONYM_TAKEN');
  await db
    .update(users)
    .set({ pseudonym: lower, pseudonymChangedAt: now, updatedAt: now })
    .where(eq(users.id, user.id));
}

export async function toMe(db: DbOrTx, user: UserRow): Promise<Me> {
  const [passkeyRow] = await db
    .select({ id: passkeys.id })
    .from(passkeys)
    .where(eq(passkeys.userId, user.id))
    .limit(1);
  return {
    id: user.id,
    email: user.email,
    pseudonym: user.pseudonym,
    pseudonymChangedAt: user.pseudonymChangedAt?.toISOString() ?? null,
    avatar: user.avatar,
    locale: user.locale,
    roomLocales: user.roomLocales as Locale[],
    roles: user.roles as ('member' | 'admin')[],
    createdAt: user.createdAt.toISOString(),
    deletionScheduledAt: user.purgeAfter?.toISOString() ?? null,
    suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
    suspendedPermanently: user.suspendedPermanently,
    settings: { ...DEFAULT_SETTINGS, ...user.settings },
    hasRecoverySetup: Boolean(user.recoverySetupAt) || Boolean(passkeyRow),
  };
}

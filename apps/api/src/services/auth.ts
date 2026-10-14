import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { LIMITS, type Locale } from '@inkwell/shared';

import {
  emailCodes,
  passkeys,
  sessions,
  users,
  webauthnChallenges,
  type UserRow,
} from '../db/schema.js';
import {
  randomSixDigitCode,
  randomToken,
  scryptHash,
  scryptVerify,
  sha256,
} from '../lib/crypto.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { signInCodeMail, type Mailer } from '../lib/mail.js';

import { createUser, emailHash, findUserByEmail } from './users.js';

import type { Database } from '../db/client.js';
import type { Env } from '../env.js';

const MAX_CODE_ATTEMPTS = 5;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface SessionResult {
  token: string;
  sessionId: string;
  user: UserRow;
  isNew: boolean;
}

export async function createSession(
  db: Database,
  userId: string,
  device: string,
  now = new Date(),
): Promise<{ token: string; id: string }> {
  const token = randomToken(32);
  const id = newId();
  await db.insert(sessions).values({
    id,
    userId,
    tokenHash: sha256(token),
    device,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + LIMITS.sessionDays * 86_400_000),
  });
  return { token, id };
}

export async function revokeSession(
  db: Database,
  sessionId: string,
  userId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
}

// --- Magic code ---------------------------------------------------------------

export async function requestEmailCode(
  db: Database,
  env: Env,
  mailer: Mailer,
  email: string,
  locale: Locale,
  purpose: 'login' | 'change_email' = 'login',
  userId: string | null = null,
): Promise<void> {
  const code = randomSixDigitCode();
  const now = new Date();
  await db.insert(emailCodes).values({
    id: newId(),
    email: email.toLowerCase(),
    emailHash: emailHash(env.SESSION_SECRET, email),
    codeHash: await scryptHash(code),
    purpose,
    userId,
    expiresAt: new Date(now.getTime() + LIMITS.magicCodeMinutes * 60_000),
    createdAt: now,
  });
  await mailer.send(signInCodeMail(email, code, LIMITS.magicCodeMinutes, locale));
}

/** Verifies the newest unconsumed code for the address. Wrong codes count towards a small attempt budget. */
export async function consumeEmailCode(
  db: Database,
  env: Env,
  email: string,
  code: string,
  purpose: 'login' | 'change_email' = 'login',
): Promise<{ userId: string | null }> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(emailCodes)
    .where(
      and(
        eq(emailCodes.emailHash, emailHash(env.SESSION_SECRET, email)),
        eq(emailCodes.purpose, purpose),
        isNull(emailCodes.consumedAt),
      ),
    )
    .orderBy(desc(emailCodes.createdAt))
    .limit(1);

  if (!row) throw new ApiError('CODE_INVALID');
  if (row.expiresAt.getTime() <= now.getTime()) throw new ApiError('CODE_EXPIRED');
  if (row.attempts >= MAX_CODE_ATTEMPTS) throw new ApiError('CODE_EXPIRED');

  const valid = await scryptVerify(code, row.codeHash);
  if (!valid) {
    await db
      .update(emailCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailCodes.id, row.id));
    throw new ApiError('CODE_INVALID', { attemptsLeft: MAX_CODE_ATTEMPTS - row.attempts - 1 });
  }
  await db.update(emailCodes).set({ consumedAt: now }).where(eq(emailCodes.id, row.id));
  return { userId: row.userId };
}

export async function signInWithEmailCode(
  db: Database,
  env: Env,
  email: string,
  code: string,
  locale: Locale,
  device: string,
): Promise<SessionResult> {
  await consumeEmailCode(db, env, email, code, 'login');
  let user = await findUserByEmail(db, env.SESSION_SECRET, email);
  let isNew = false;
  if (!user) {
    user = await createUser(db, env.SESSION_SECRET, { email, locale });
    isNew = true;
  }
  assertCanSignIn(user);
  const session = await createSession(db, user.id, device);
  return { token: session.token, sessionId: session.id, user, isNew };
}

// --- Password ---------------------------------------------------------------------

/**
 * Hash verified when the address is unknown or has no password, so a failed
 * attempt costs the same time either way and reveals nothing about the account.
 */
const DECOY_HASH = await scryptHash(randomToken(16));

export async function signInWithPassword(
  db: Database,
  env: Env,
  email: string,
  password: string,
  device: string,
): Promise<SessionResult> {
  const user = await findUserByEmail(db, env.SESSION_SECRET, email);
  const valid = await scryptVerify(password, user?.passwordHash ?? DECOY_HASH);
  if (!user?.passwordHash || !valid) throw new ApiError('CREDENTIALS_INVALID');
  assertCanSignIn(user);
  const session = await createSession(db, user.id, device);
  return { token: session.token, sessionId: session.id, user, isNew: false };
}

export async function setPassword(db: Database, userId: string, password: string): Promise<void> {
  await db
    .update(users)
    .set({ passwordHash: await scryptHash(password), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

function assertCanSignIn(user: UserRow): void {
  if (user.suspendedPermanently) return; // may still read and export
  if (user.deletedAt && user.purgeAfter && user.purgeAfter.getTime() <= Date.now()) {
    throw new ApiError('ACCOUNT_PENDING_DELETION');
  }
}

// --- Passkeys ---------------------------------------------------------------------

async function storeChallenge(
  db: Database,
  challenge: string,
  intent: string,
  userId: string | null,
): Promise<string> {
  const id = randomToken(16);
  await db.insert(webauthnChallenges).values({
    id,
    challenge,
    intent,
    userId,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
  return id;
}

async function takeChallenge(
  db: Database,
  id: string,
  intent: string,
): Promise<{ challenge: string; userId: string | null }> {
  const [row] = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.id, id),
        eq(webauthnChallenges.intent, intent),
        gt(webauthnChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) throw new ApiError('PASSKEY_INVALID', { reason: 'challenge' });
  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, id));
  return { challenge: row.challenge, userId: row.userId };
}

export async function passkeyRegistrationOptions(
  db: Database,
  env: Env,
  user: UserRow,
): Promise<{ challengeId: string; options: PublicKeyCredentialCreationOptionsJSON }> {
  const existing = await db.select().from(passkeys).where(eq(passkeys.userId, user.id));
  const options = await generateRegistrationOptions({
    rpName: 'Inkwell',
    rpID: env.RP_ID,
    userName: user.pseudonym,
    userDisplayName: user.pseudonym,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials: existing.map((row) => ({
      id: row.id,
      transports: row.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
  });
  const challengeId = await storeChallenge(db, options.challenge, 'register', user.id);
  return { challengeId, options };
}

export async function passkeyRegistrationVerify(
  db: Database,
  env: Env,
  user: UserRow,
  challengeId: string,
  response: RegistrationResponseJSON,
  name: string,
): Promise<void> {
  const { challenge, userId } = await takeChallenge(db, challengeId, 'register');
  if (userId !== user.id) throw new ApiError('PASSKEY_INVALID', { reason: 'user' });
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: env.APP_ORIGIN,
    expectedRPID: env.RP_ID,
    requireUserVerification: false,
  });
  if (!verification.verified || !verification.registrationInfo)
    throw new ApiError('PASSKEY_INVALID');
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await db.insert(passkeys).values({
    id: credential.id,
    userId: user.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: credential.transports ?? [],
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    name,
  });
}

export async function passkeyAuthenticationOptions(
  db: Database,
  env: Env,
): Promise<{ challengeId: string; options: PublicKeyCredentialRequestOptionsJSON }> {
  const options = await generateAuthenticationOptions({
    rpID: env.RP_ID,
    allowCredentials: [],
    userVerification: 'preferred',
  });
  const challengeId = await storeChallenge(db, options.challenge, 'authenticate', null);
  return { challengeId, options };
}

export async function passkeyAuthenticationVerify(
  db: Database,
  env: Env,
  challengeId: string,
  response: AuthenticationResponseJSON,
  device: string,
): Promise<SessionResult> {
  const { challenge } = await takeChallenge(db, challengeId, 'authenticate');
  const [stored] = await db.select().from(passkeys).where(eq(passkeys.id, response.id)).limit(1);
  if (!stored) throw new ApiError('PASSKEY_INVALID', { reason: 'unknown_credential' });

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: env.APP_ORIGIN,
    expectedRPID: env.RP_ID,
    requireUserVerification: false,
    credential: {
      id: stored.id,
      publicKey: new Uint8Array(Buffer.from(stored.publicKey, 'base64url')),
      counter: stored.counter,
      transports: stored.transports,
    },
  });
  if (!verification.verified) throw new ApiError('PASSKEY_INVALID');

  await db
    .update(passkeys)
    .set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() })
    .where(eq(passkeys.id, stored.id));

  const [user] = await db.select().from(users).where(eq(users.id, stored.userId)).limit(1);
  if (!user) throw new ApiError('PASSKEY_INVALID');
  assertCanSignIn(user);
  const session = await createSession(db, user.id, device);
  return { token: session.token, sessionId: session.id, user, isNew: false };
}

// --- Sign in with Apple -----------------------------------------------------------------

const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export async function signInWithApple(
  db: Database,
  env: Env,
  identityToken: string,
  nonce: string | undefined,
  locale: Locale,
  device: string,
): Promise<SessionResult> {
  if (!env.APPLE_CLIENT_ID) throw new ApiError('APPLE_TOKEN_INVALID', { reason: 'not_configured' });
  let payload: { sub?: string; email?: string; nonce?: string };
  try {
    const result = await jwtVerify(identityToken, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience: env.APPLE_CLIENT_ID,
    });
    payload = result.payload;
  } catch {
    throw new ApiError('APPLE_TOKEN_INVALID');
  }
  if (!payload.sub) throw new ApiError('APPLE_TOKEN_INVALID');
  if (nonce && payload.nonce !== sha256Hex(nonce) && payload.nonce !== nonce)
    throw new ApiError('APPLE_TOKEN_INVALID', { reason: 'nonce' });

  let [user] = await db.select().from(users).where(eq(users.appleSub, payload.sub)).limit(1);
  let isNew = false;
  if (!user && payload.email) {
    const byEmail = await findUserByEmail(db, env.SESSION_SECRET, payload.email);
    if (byEmail) {
      await db
        .update(users)
        .set({ appleSub: payload.sub, updatedAt: new Date() })
        .where(eq(users.id, byEmail.id));
      user = { ...byEmail, appleSub: payload.sub };
    }
  }
  if (!user) {
    if (!payload.email) throw new ApiError('APPLE_TOKEN_INVALID', { reason: 'email_missing' });
    user = await createUser(db, env.SESSION_SECRET, {
      email: payload.email,
      locale,
      appleSub: payload.sub,
    });
    isNew = true;
  }
  assertCanSignIn(user);
  const session = await createSession(db, user.id, device);
  return { token: session.token, sessionId: session.id, user, isNew };
}

function sha256Hex(value: string): string {
  return Buffer.from(sha256(value), 'base64url').toString('hex');
}

'use server';

import { completeOnboardingSchema, pseudonymSchema, type Locale, type Me } from '@inkwell/shared';

import { api } from '@/lib/api-client';
import { failure, type ActionResult } from '@/lib/api-errors';

import { clearSessionCookie, sessionToken, setSessionCookie } from './session';

interface SessionResponse {
  token: string;
  isNew: boolean;
  needsOnboarding: boolean;
  me: Me;
}

export async function requestEmailCode(email: string, locale: Locale): Promise<ActionResult> {
  try {
    await api('/auth/email/code', { method: 'POST', body: { email }, locale, token: null });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function verifyEmailCode(
  email: string,
  code: string,
  locale: Locale,
): Promise<ActionResult<{ needsOnboarding: boolean; me: Me }>> {
  try {
    const result = await api<SessionResponse>('/auth/email/verify', {
      method: 'POST',
      body: { email, code },
      locale,
      token: null,
    });
    await setSessionCookie(result.token);
    return { ok: true, data: { needsOnboarding: result.needsOnboarding, me: result.me } };
  } catch (error) {
    return failure(error);
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
  locale: Locale,
): Promise<ActionResult<{ needsOnboarding: boolean; me: Me }>> {
  try {
    const result = await api<SessionResponse>('/auth/password/sign-in', {
      method: 'POST',
      body: { email, password },
      locale,
      token: null,
    });
    await setSessionCookie(result.token);
    return { ok: true, data: { needsOnboarding: result.needsOnboarding, me: result.me } };
  } catch (error) {
    return failure(error);
  }
}

export async function passkeyOptions(
  intent: 'register' | 'authenticate',
): Promise<ActionResult<{ challengeId: string; options: unknown }>> {
  try {
    const data = await api<{ challengeId: string; options: unknown }>('/auth/passkey/options', {
      method: 'POST',
      body: { intent },
    });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function passkeyVerify(
  intent: 'register' | 'authenticate',
  challengeId: string,
  response: unknown,
  name?: string,
): Promise<ActionResult<{ needsOnboarding: boolean } | { registered: true }>> {
  try {
    if (intent === 'register') {
      await api('/auth/passkey/verify', {
        method: 'POST',
        body: { intent, challengeId, response, name },
      });
      return { ok: true, data: { registered: true } };
    }
    const result = await api<SessionResponse>('/auth/passkey/verify', {
      method: 'POST',
      body: { intent, challengeId, response },
      token: null,
    });
    await setSessionCookie(result.token);
    return { ok: true, data: { needsOnboarding: result.needsOnboarding } };
  } catch (error) {
    return failure(error);
  }
}

export async function signInWithApple(
  identityToken: string,
  nonce: string | undefined,
  locale: Locale,
): Promise<ActionResult<{ needsOnboarding: boolean }>> {
  try {
    const result = await api<SessionResponse>('/auth/apple', {
      method: 'POST',
      body: { identityToken, nonce },
      locale,
      token: null,
    });
    await setSessionCookie(result.token);
    return { ok: true, data: { needsOnboarding: result.needsOnboarding } };
  } catch (error) {
    return failure(error);
  }
}

export async function checkPseudonym(
  pseudonym: string,
): Promise<ActionResult<{ available: boolean }>> {
  const parsed = pseudonymSchema.safeParse(pseudonym);
  if (!parsed.success) return { ok: false, error: 'PSEUDONYM_INVALID' };
  try {
    const data = await api<{ available: boolean }>('/auth/pseudonym/check', {
      method: 'POST',
      body: { pseudonym: parsed.data },
    });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function completeOnboarding(input: unknown): Promise<ActionResult<Me>> {
  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  try {
    const { me } = await api<{ me: Me }>('/auth/onboarding', { method: 'POST', body: parsed.data });
    return { ok: true, data: me };
  } catch (error) {
    return failure(error);
  }
}

export async function confirmRecoverySetup(): Promise<ActionResult> {
  try {
    await api('/auth/recovery/confirm', { method: 'POST' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function signOut(): Promise<ActionResult> {
  try {
    const token = await sessionToken();
    if (token) await api('/auth/sign-out', { method: 'POST', token });
  } catch {
    // The cookie is cleared regardless; a stale server session expires on its own.
  }
  await clearSessionCookie();
  return { ok: true, data: undefined };
}

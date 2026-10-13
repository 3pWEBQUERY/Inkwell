import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { LIMITS, type Me } from '@inkwell/shared';

import { serverEnv } from '@/env';
import { api } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api-errors';

export async function sessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(serverEnv().SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(serverEnv().SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: LIMITS.sessionDays * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(serverEnv().SESSION_COOKIE_NAME);
}

/** The signed-in person, or null. Cached per request so layouts and pages share one call. */
export const getMe = cache(async (): Promise<Me | null> => {
  const token = await sessionToken();
  if (!token) return null;
  try {
    return await api<Me>('/me', { token });
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403))
      return null;
    throw error;
  }
});

export async function requireMe(): Promise<Me> {
  const me = await getMe();
  if (!me) throw new ApiClientError('UNAUTHENTICATED', 401);
  return me;
}

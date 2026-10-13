import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { publicEnv } from '@/env';
import { setSessionCookie } from '@/features/auth/session';
import { api } from '@/lib/api-client';

import type { Me } from '@inkwell/shared';

/** Apple posts `id_token` and `state` here; the API verifies the token and returns a session. */
export async function POST(request: Request) {
  const form = await request.formData();
  const idTokenValue = form.get('id_token');
  const stateValue = form.get('state');
  const idToken = typeof idTokenValue === 'string' ? idTokenValue : '';
  const state = typeof stateValue === 'string' ? stateValue : '';
  const store = await cookies();
  const bound = store.get('inkwell_apple')?.value ?? '';
  const [nonce, expectedState] = bound.split('.');
  store.delete('inkwell_apple');
  if (!idToken || !nonce || state !== expectedState) {
    return NextResponse.redirect(`${publicEnv.appOrigin}/sign-in?error=APPLE_TOKEN_INVALID`, 303);
  }
  try {
    const result = await api<{ token: string; needsOnboarding: boolean; me: Me }>('/auth/apple', {
      method: 'POST',
      body: { identityToken: idToken, nonce },
      token: null,
    });
    await setSessionCookie(result.token);
    return NextResponse.redirect(
      `${publicEnv.appOrigin}${result.needsOnboarding ? '/sign-in' : '/today'}`,
      303,
    );
  } catch {
    return NextResponse.redirect(`${publicEnv.appOrigin}/sign-in?error=APPLE_TOKEN_INVALID`, 303);
  }
}

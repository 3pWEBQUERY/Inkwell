import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { publicEnv } from '@/env';

/** Starts "Sign in with Apple" as a redirect flow; the nonce is bound to a short-lived cookie. */
export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  if (!clientId) return new NextResponse(null, { status: 404 });
  const nonce = crypto.randomUUID();
  const state = crypto.randomUUID();
  const store = await cookies();
  store.set('inkwell_apple', `${nonce}.${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  const url = new URL('https://appleid.apple.com/auth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${publicEnv.appOrigin}/api/auth/apple/callback`);
  url.searchParams.set('response_type', 'code id_token');
  url.searchParams.set('response_mode', 'form_post');
  url.searchParams.set('scope', 'name email');
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('state', state);
  return NextResponse.redirect(url);
}

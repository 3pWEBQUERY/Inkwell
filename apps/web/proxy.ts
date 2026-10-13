import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

const intl = createIntlMiddleware(routing);

const ADMIN_PATH = /^(?:\/(?:de|fr|it|en))?\/admin(?:\/|$)/;
const DEVICE_COOKIE = 'inkwell_device';

/**
 * Runs before every page: locale negotiation, a per-request CSP nonce, the admin
 * IP allowlist and a random device id (hashed server-side for rate limits).
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN_PATH.test(pathname) && !ipAllowed(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const csp = contentSecurityPolicy(nonce);

  const response = intl(request);

  // Hand the nonce to the rendering layer. next-intl's rewrite already lists the
  // request headers it forwards; the nonce is appended to that list the same way
  // NextResponse.next({ request: { headers } }) would register it.
  forwardRequestHeader(response, 'x-nonce', nonce);
  response.headers.set('Content-Security-Policy', csp);

  if (!request.cookies.get(DEVICE_COOKIE)) {
    const id = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url');
    response.cookies.set(DEVICE_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

function forwardRequestHeader(response: NextResponse, name: string, value: string): void {
  response.headers.set(`x-middleware-request-${name}`, value);
  const override = response.headers.get('x-middleware-override-headers');
  if (override && !override.split(',').includes(name)) {
    response.headers.set('x-middleware-override-headers', `${override},${name}`);
  } else if (!override) {
    response.headers.set('x-middleware-override-headers', name);
  }
}

function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    // Tiptap and the view-transition runtime set inline styles on elements; style attributes need this.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function ipAllowed(request: NextRequest): boolean {
  const allowlist = (process.env.ADMIN_IP_ALLOWLIST ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return process.env.NODE_ENV !== 'production';
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded ?? request.headers.get('x-real-ip') ?? '';
  return allowlist.some((entry) => matches(ip, entry));
}

function matches(ip: string, entry: string): boolean {
  if (!entry.includes('/')) return ip === entry;
  const [network, bitsRaw] = entry.split('/');
  const bits = Number.parseInt(bitsRaw ?? '', 10);
  const a = ipv4ToInt(ip);
  const b = ipv4ToInt(network ?? '');
  if (a === null || b === null || Number.isNaN(bits)) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (a & mask) === (b & mask);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255))
    return null;
  return parts.reduce((acc, part) => ((acc << 8) | part) >>> 0, 0);
}

export const config = {
  matcher: [
    '/((?!api|_next|sw\\.js|manifest\\.webmanifest|icons|fonts|images|robots\\.txt|sitemap\\.xml|favicon\\.ico).*)',
  ],
};

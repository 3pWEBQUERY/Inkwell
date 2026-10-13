import 'server-only';

import { createHash } from 'node:crypto';

import { cookies, headers } from 'next/headers';

import { serverEnv } from '@/env';

import { ApiClientError } from './api-errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Raw body (multipart) when `body` is not JSON. */
  raw?: BodyInit;
  token?: string | null;
  locale?: string;
  tags?: string[];
  revalidate?: number | false;
}

const DEVICE_COOKIE = 'inkwell_device';

/**
 * The only path from the web service to the API: adds the internal token, the
 * session, the locale and a hashed device id. The browser never calls the API.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const env = serverEnv();
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    options.token === undefined ? cookieStore.get(env.SESSION_COOKIE_NAME)?.value : options.token;
  const device = cookieStore.get(DEVICE_COOKIE)?.value;

  const requestHeaders: Record<string, string> = {
    'x-internal-token': env.API_INTERNAL_TOKEN,
    accept: 'application/json',
    'x-locale': options.locale ?? headerStore.get('x-next-intl-locale') ?? 'de',
    'user-agent': headerStore.get('user-agent') ?? '',
  };
  if (token) requestHeaders.authorization = `Bearer ${token}`;
  if (device)
    requestHeaders['x-device-hash'] = createHash('sha256').update(device).digest('base64url');

  let body: BodyInit | undefined;
  if (options.raw) {
    body = options.raw;
  } else if (options.body !== undefined) {
    requestHeaders['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const init: RequestInit & { next?: { tags: string[]; revalidate: number | false } } = {
    method: options.method ?? 'GET',
    headers: requestHeaders,
    body: body ?? null,
  };
  if (options.tags) init.next = { tags: options.tags, revalidate: options.revalidate ?? 30 };
  else init.cache = 'no-store';

  const response = await fetch(`${env.API_URL}/v1${path}`, init);

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) throw ApiClientError.fromResponse(response.status, payload);
  return payload as T;
}

/** Streams a binary response (archives, avatars) through the web service. */
export async function apiBinary(path: string, token?: string | null): Promise<Response> {
  const env = serverEnv();
  const cookieStore = await cookies();
  const sessionToken =
    token === undefined ? cookieStore.get(env.SESSION_COOKIE_NAME)?.value : token;
  const requestHeaders: Record<string, string> = { 'x-internal-token': env.API_INTERNAL_TOKEN };
  if (sessionToken) requestHeaders.authorization = `Bearer ${sessionToken}`;
  return fetch(`${env.API_URL}/v1${path}`, { headers: requestHeaders, cache: 'no-store' });
}

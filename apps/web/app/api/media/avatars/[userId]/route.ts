import { apiBinary } from '@/lib/api-client';

/** Avatars live in object storage behind the API; this streams them to the browser with long caching. */
export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  if (!/^[a-z0-9]{24}$/.test(userId)) return new Response(null, { status: 404 });
  const upstream = await apiBinary(`/media/avatars/${userId}`, null);
  if (!upstream.ok) return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  return new Response(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/webp',
      'cache-control': 'public, max-age=86400, immutable',
    },
  });
}

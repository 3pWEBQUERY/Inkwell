import { apiBinary } from '@/lib/api-client';

/** Development fallback: streams the export archive when no object storage with presigned URLs is configured. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const key = decodeURIComponent(id);
  const exportId =
    key
      .split('/')
      .pop()
      ?.replace(/\.zip$/, '') ?? '';
  if (!/^[a-z0-9]{24}$/.test(exportId)) return new Response(null, { status: 404 });
  const upstream = await apiBinary(`/me/export/${exportId}/archive`);
  if (!upstream.ok) return new Response(null, { status: upstream.status });
  return new Response(upstream.body, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename="inkwell-export.zip"',
      'cache-control': 'no-store',
    },
  });
}

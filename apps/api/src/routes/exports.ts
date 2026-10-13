import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { exports } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { requestExport } from '../services/exports.js';

import type { ExportJob } from '@inkwell/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const exportRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, storage } = app.ctx;

  async function toView(row: typeof exports.$inferSelect): Promise<ExportJob> {
    const downloadUrl =
      row.status === 'ready' && row.s3Key
        ? await storage.presignedGetUrl(row.s3Key, 3600, 'inkwell-export.zip')
        : null;
    return {
      id: row.id,
      status: row.status,
      downloadUrl,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  app.post('/', async (request, reply) => {
    const { user } = request.requireUser();
    await app.rateLimit(`export:${user.id}`, 3, 24 * 60 * 60);
    const id = await requestExport(db, user);
    return reply.status(202).send({ id });
  });

  app.get('/latest', async (request) => {
    const { user } = request.requireUser();
    const [row] = await db
      .select()
      .from(exports)
      .where(eq(exports.userId, user.id))
      .orderBy(desc(exports.createdAt))
      .limit(1);
    return row ? await toView(row) : null;
  });

  app.get('/:id', { schema: { params: z.object({ id: z.string() }) } }, async (request) => {
    const { user } = request.requireUser();
    const [row] = await db
      .select()
      .from(exports)
      .where(and(eq(exports.id, request.params.id), eq(exports.userId, user.id)))
      .limit(1);
    if (!row) throw new ApiError('EXPORT_NOT_FOUND');
    return toView(row);
  });

  /** Streams the archive through the web service when object storage is not configured (development). */
  app.get(
    '/:id/archive',
    { schema: { params: z.object({ id: z.string() }) } },
    async (request, reply) => {
      const { user } = request.requireUser();
      const [row] = await db
        .select()
        .from(exports)
        .where(and(eq(exports.id, request.params.id), eq(exports.userId, user.id)))
        .limit(1);
      if (!row?.s3Key) throw new ApiError('EXPORT_NOT_FOUND');
      if (row.status !== 'ready') throw new ApiError('EXPORT_NOT_READY');
      const object = await storage.get(row.s3Key);
      if (!object) throw new ApiError('EXPORT_NOT_FOUND');
      return reply.header('content-type', 'application/zip').send(Buffer.from(object.body));
    },
  );
};

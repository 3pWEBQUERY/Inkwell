import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { createSeriesSchema, reorderSeriesSchema, type Series } from '@inkwell/shared';

import { posts, series, seriesSubscriptions, users } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const idParams = z.object({ id: z.string().min(10) });

export const seriesRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db } = app.ctx;

  async function view(seriesId: string, viewerId: string | null): Promise<Series> {
    const [row] = await db
      .select({ series: series, pseudonym: users.pseudonym, avatar: users.avatar })
      .from(series)
      .innerJoin(users, eq(users.id, series.authorId))
      .where(eq(series.id, seriesId))
      .limit(1);
    if (!row) throw new ApiError('SERIES_NOT_FOUND');
    const chapters = await db
      .select({
        postId: posts.id,
        chapter: posts.chapter,
        title: posts.title,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(
        and(eq(posts.seriesId, seriesId), isNull(posts.deletedAt), eq(posts.status, 'visible')),
      )
      .orderBy(asc(posts.chapter));
    const [subscription] = viewerId
      ? await db
          .select({ userId: seriesSubscriptions.userId })
          .from(seriesSubscriptions)
          .where(
            and(
              eq(seriesSubscriptions.seriesId, seriesId),
              eq(seriesSubscriptions.userId, viewerId),
            ),
          )
          .limit(1)
      : [];
    return {
      id: row.series.id,
      title: row.series.title,
      description: row.series.description,
      chapterCount: chapters.length,
      subscribed: Boolean(subscription),
      author: { pseudonym: row.pseudonym, avatar: row.avatar },
      chapters: chapters.map((c) => ({
        postId: c.postId,
        chapter: c.chapter ?? 0,
        title: c.title ?? '',
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  app.get('/mine', async (request) => {
    const { user } = request.requireUser();
    const rows = await db
      .select({
        id: series.id,
        title: series.title,
        description: series.description,
        count: sql<number>`count(${posts.id})::int`,
      })
      .from(series)
      .leftJoin(posts, and(eq(posts.seriesId, series.id), isNull(posts.deletedAt)))
      .where(eq(series.authorId, user.id))
      .groupBy(series.id)
      .orderBy(asc(series.createdAt));
    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        chapterCount: row.count,
      })),
    };
  });

  app.post('/', { schema: { body: createSeriesSchema } }, async (request, reply) => {
    const { user } = request.requireActiveUser();
    const id = newId();
    await db.insert(series).values({
      id,
      authorId: user.id,
      title: request.body.title,
      description: request.body.description,
    });
    return reply.status(201).send({ id });
  });

  app.get('/:id', { schema: { params: idParams } }, async (request) =>
    view(request.params.id, request.auth?.user.id ?? null),
  );

  app.patch(
    '/:id',
    { schema: { params: idParams, body: createSeriesSchema.partial() } },
    async (request) => {
      const { user } = request.requireActiveUser();
      const rows = await db
        .update(series)
        .set(request.body)
        .where(and(eq(series.id, request.params.id), eq(series.authorId, user.id)))
        .returning({ id: series.id });
      if (rows.length === 0) throw new ApiError('SERIES_NOT_FOUND');
      return { ok: true };
    },
  );

  /** Drag-and-drop ordering: chapter numbers follow the given order. */
  app.put(
    '/:id/order',
    { schema: { params: idParams, body: reorderSeriesSchema } },
    async (request) => {
      const { user } = request.requireActiveUser();
      const [owned] = await db
        .select()
        .from(series)
        .where(eq(series.id, request.params.id))
        .limit(1);
      if (!owned) throw new ApiError('SERIES_NOT_FOUND');
      if (owned.authorId !== user.id) throw new ApiError('SERIES_NOT_OWNED');
      await db.transaction(async (tx) => {
        for (const [index, postId] of request.body.postIds.entries()) {
          await tx
            .update(posts)
            .set({ chapter: index + 1 })
            .where(
              and(eq(posts.id, postId), eq(posts.seriesId, owned.id), eq(posts.authorId, user.id)),
            );
        }
      });
      return { ok: true };
    },
  );

  app.put(
    '/:id/subscription',
    { schema: { params: idParams, body: z.object({ subscribed: z.boolean() }) } },
    async (request) => {
      const { user } = request.requireActiveUser();
      if (request.body.subscribed) {
        await db
          .insert(seriesSubscriptions)
          .values({ seriesId: request.params.id, userId: user.id })
          .onConflictDoNothing();
      } else {
        await db
          .delete(seriesSubscriptions)
          .where(
            and(
              eq(seriesSubscriptions.seriesId, request.params.id),
              eq(seriesSubscriptions.userId, user.id),
            ),
          );
      }
      return { subscribed: request.body.subscribed };
    },
  );
};

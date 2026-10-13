import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { LIMITS, createPostSchema, updatePostSchema } from '@inkwell/shared';

import { rooms, series } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { createSystemFlag } from '../services/moderation.js';
import { notifyRoomOnNewPost, notifySeriesOnNewChapter } from '../services/notify.js';
import { burnPost, createPost, findFeedPost, updatePost, viewerFor } from '../services/posts.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const idParams = z.object({ id: z.string().min(10) });

export const postRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, env, push } = app.ctx;

  app.post('/', { schema: { body: createPostSchema } }, async (request, reply) => {
    const { user } = request.requireActiveUser();
    if (request.body.visibility !== 'private') {
      await app.rateLimit(`publish:${user.id}`, LIMITS.publishPerDay, 24 * 60 * 60);
    }
    const { post, spamSignals } = await createPost(db, user, request.body);

    if (spamSignals.length > 0) {
      await createSystemFlag(
        db,
        'post',
        post.id,
        spamSignals.map((s) => `${s.kind}: ${s.detail}`).join('; '),
      );
    }

    if (post.roomId && post.visibility !== 'private') {
      const [room] = await db
        .select({ name: rooms.name, slug: rooms.slug })
        .from(rooms)
        .where(eq(rooms.id, post.roomId))
        .limit(1);
      if (room) void notifyRoomOnNewPost(db, push, env.APP_ORIGIN, post, room.name, room.slug);
      if (post.seriesId) {
        const [s] = await db
          .select({ title: series.title })
          .from(series)
          .where(eq(series.id, post.seriesId))
          .limit(1);
        if (s) void notifySeriesOnNewChapter(db, push, env.APP_ORIGIN, post, s.title);
      }
    }

    const viewer = await viewerFor(db, user.id);
    const view = post.visibility === 'private' ? null : await findFeedPost(db, post.id, viewer);
    return reply
      .status(201)
      .send({ id: post.id, createdAt: post.createdAt.toISOString(), post: view });
  });

  app.get('/:id', { schema: { params: idParams } }, async (request) => {
    const viewer = await viewerFor(db, request.auth?.user.id ?? null);
    const post = await findFeedPost(db, request.params.id, viewer);
    if (!post) throw new ApiError('POST_NOT_FOUND');
    return post;
  });

  app.patch('/:id', { schema: { params: idParams, body: updatePostSchema } }, async (request) => {
    const { user } = request.requireActiveUser();
    const post = await updatePost(db, user, request.params.id, request.body);
    return {
      id: post.id,
      visibility: post.visibility,
      updatedAt: post.updatedAt.toISOString(),
      editedAt: post.editedAt?.toISOString() ?? null,
    };
  });

  app.delete('/:id', { schema: { params: idParams } }, async (request, reply) => {
    const { user } = request.requireUser();
    await burnPost(db, user, request.params.id);
    return reply.status(204).send();
  });
};

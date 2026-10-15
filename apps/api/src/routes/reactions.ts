import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { reactionKindSchema } from '@inkwell/shared';

import { bookmarks, reactions } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { findFeedPost, viewerFor } from '../services/posts.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const params = z.object({ id: z.string().min(10), kind: reactionKindSchema });
const idOnly = z.object({ id: z.string().min(10) });

export const reactionRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db } = app.ctx;

  app.put('/:id/reactions/:kind', { schema: { params } }, async (request, reply) => {
    const { user } = request.requireActiveUser();
    const viewer = await viewerFor(db, user.id);
    const post = await findFeedPost(db, request.params.id, viewer);
    if (!post) throw new ApiError('POST_NOT_FOUND');
    if (post.viewer.isAuthor) return reply.status(204).send();
    await db
      .insert(reactions)
      .values({ postId: post.id, userId: user.id, kind: request.params.kind })
      .onConflictDoNothing();
    return reply.status(204).send();
  });

  /** Keep a text for later. Own texts are already in the journal; keeping them is a no-op. */
  app.put('/:id/bookmark', { schema: { params: idOnly } }, async (request, reply) => {
    const { user } = request.requireUser();
    await app.rateLimit(`bookmark:${user.id}`, 120, 60 * 60);
    const viewer = await viewerFor(db, user.id);
    const post = await findFeedPost(db, request.params.id, viewer);
    if (!post) throw new ApiError('POST_NOT_FOUND');
    if (post.viewer.isAuthor) return reply.status(204).send();
    await db.insert(bookmarks).values({ postId: post.id, userId: user.id }).onConflictDoNothing();
    return reply.status(204).send();
  });

  app.delete('/:id/bookmark', { schema: { params: idOnly } }, async (request, reply) => {
    const { user } = request.requireUser();
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.postId, request.params.id), eq(bookmarks.userId, user.id)));
    return reply.status(204).send();
  });

  app.delete('/:id/reactions/:kind', { schema: { params } }, async (request, reply) => {
    const { user } = request.requireUser();
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.postId, request.params.id),
          eq(reactions.userId, user.id),
          eq(reactions.kind, request.params.kind),
        ),
      );
    return reply.status(204).send();
  });
};

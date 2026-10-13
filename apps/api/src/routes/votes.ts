import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { voteSchema } from '@inkwell/shared';

import { votes } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { findFeedPost, viewerFor } from '../services/posts.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const voteRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db } = app.ctx;

  app.put(
    '/:id/vote',
    { schema: { params: z.object({ id: z.string().min(10) }), body: voteSchema } },
    async (request) => {
      const { user } = request.requireActiveUser();
      const viewer = await viewerFor(db, user.id);
      const post = await findFeedPost(db, request.params.id, viewer);
      if (!post) throw new ApiError('POST_NOT_FOUND');
      // The database trigger enforces this too; the explicit check gives a precise error code.
      if (post.room.kind !== 'fiction') throw new ApiError('VOTING_DISABLED_IN_ROOM');
      if (post.viewer.isAuthor) return { vote: 0 };

      if (request.body.value === 0) {
        await db.delete(votes).where(and(eq(votes.postId, post.id), eq(votes.userId, user.id)));
        return { vote: 0 };
      }
      await db
        .insert(votes)
        .values({ postId: post.id, userId: user.id, value: request.body.value })
        .onConflictDoUpdate({
          target: [votes.postId, votes.userId],
          set: { value: request.body.value, updatedAt: new Date() },
        });
      return { vote: request.body.value };
    },
  );
};

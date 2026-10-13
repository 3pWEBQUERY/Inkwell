import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { LIMITS, createCommentSchema, type CommentView } from '@inkwell/shared';

import { comments, posts, users } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { hiddenUserIds } from '../services/blocks.js';
import { notifyAuthorOnComment } from '../services/notify.js';
import { findFeedPost, viewerFor } from '../services/posts.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const idParams = z.object({ id: z.string().min(10) });

export const commentRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, env, push } = app.ctx;

  app.get('/:id/comments', { schema: { params: idParams } }, async (request) => {
    const userId = request.auth?.user.id ?? null;
    const viewer = await viewerFor(db, userId);
    const post = await findFeedPost(db, request.params.id, viewer);
    if (!post) throw new ApiError('POST_NOT_FOUND');
    const hidden = await hiddenUserIds(db, userId);
    const rows = await db
      .select({
        comment: comments,
        pseudonym: users.pseudonym,
        avatar: users.avatar,
        postVisibility: posts.visibility,
        postAuthorId: posts.authorId,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .innerJoin(posts, eq(posts.id, comments.postId))
      .where(and(eq(comments.postId, post.id), isNull(comments.deletedAt)))
      .orderBy(asc(comments.createdAt));

    const items: CommentView[] = rows
      .filter((row) => !hidden.has(row.comment.authorId))
      .filter(
        (row) => !row.comment.hiddenAt || row.comment.authorId === userId || post.viewer.isAuthor,
      )
      .map((row) => {
        // The author of an anonymous text stays anonymous in their own comments as well.
        const anonymousAuthor =
          row.postVisibility === 'anonymous' && row.comment.authorId === row.postAuthorId;
        return {
          id: row.comment.id,
          mode: row.comment.mode,
          body: row.comment.body,
          worked: row.comment.worked,
          unclear: row.comment.unclear,
          author: anonymousAuthor ? null : { pseudonym: row.pseudonym, avatar: row.avatar },
          isOwn: row.comment.authorId === userId,
          createdAt: row.comment.createdAt.toISOString(),
          hidden: Boolean(row.comment.hiddenAt),
        };
      });
    return { items };
  });

  app.post(
    '/:id/comments',
    { schema: { params: idParams, body: createCommentSchema } },
    async (request, reply) => {
      const { user } = request.requireActiveUser();
      await app.rateLimit(`comments:${user.id}`, LIMITS.commentsPerHour, 60 * 60);
      const viewer = await viewerFor(db, user.id);
      const post = await findFeedPost(db, request.params.id, viewer);
      if (!post) throw new ApiError('POST_NOT_FOUND');
      if (!post.commentsEnabled) throw new ApiError('COMMENTS_DISABLED');

      const feedbackRoom = post.room.kind === 'fiction';
      if (feedbackRoom && request.body.mode !== 'feedback')
        throw new ApiError('FEEDBACK_FIELDS_REQUIRED');

      const [postRow] = await db.select().from(posts).where(eq(posts.id, post.id)).limit(1);
      if (!postRow) throw new ApiError('POST_NOT_FOUND');

      const id = newId();
      if (request.body.mode === 'feedback') {
        await db.insert(comments).values({
          id,
          postId: post.id,
          authorId: user.id,
          mode: 'feedback',
          body: `${request.body.worked}\n\n${request.body.unclear}`,
          worked: request.body.worked,
          unclear: request.body.unclear,
        });
      } else {
        await db.insert(comments).values({
          id,
          postId: post.id,
          authorId: user.id,
          mode: 'reply',
          body: request.body.body,
        });
      }

      if (!post.viewer.isAuthor) void notifyAuthorOnComment(db, push, env.APP_ORIGIN, postRow);
      return reply.status(201).send({ id });
    },
  );

  /** The author of the text hides a comment for everyone; the commenter deletes their own. */
  app.delete(
    '/:id/comments/:commentId',
    { schema: { params: z.object({ id: z.string(), commentId: z.string() }) } },
    async (request, reply) => {
      const { user } = request.requireUser();
      const [row] = await db
        .select({ comment: comments, postAuthorId: posts.authorId })
        .from(comments)
        .innerJoin(posts, eq(posts.id, comments.postId))
        .where(
          and(
            eq(comments.id, request.params.commentId),
            eq(comments.postId, request.params.id),
            isNull(comments.deletedAt),
          ),
        )
        .limit(1);
      if (!row) throw new ApiError('COMMENT_NOT_FOUND');
      if (row.comment.authorId === user.id) {
        await db
          .update(comments)
          .set({ deletedAt: new Date() })
          .where(eq(comments.id, row.comment.id));
      } else if (row.postAuthorId === user.id) {
        await db
          .update(comments)
          .set({ hiddenAt: new Date() })
          .where(eq(comments.id, row.comment.id));
      } else {
        throw new ApiError('FORBIDDEN');
      }
      return reply.status(204).send();
    },
  );
};

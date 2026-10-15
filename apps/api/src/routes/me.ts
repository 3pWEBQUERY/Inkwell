import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import {
  blockSchema,
  changeEmailSchema,
  confirmEmailChangeSchema,
  journalQuerySchema,
  renamePasskeySchema,
  updateMeSchema,
  type PasskeyView,
  type SessionView,
} from '@inkwell/shared';

import { blocks, comments, passkeys, posts, sessions, users } from '../db/schema.js';
import { normalizeAvatar } from '../lib/avatar.js';
import { ApiError } from '../lib/errors.js';
import { consumeEmailCode, requestEmailCode, revokeSession } from '../services/auth.js';
import { revokeDeletion, scheduleDeletion } from '../services/deletion.js';
import { noticesFor } from '../services/moderation.js';
import {
  bookmarkedPosts,
  journal,
  profilePosts,
  reactionSummary,
  requireOwnPost,
  todayFeed,
  viewerFor,
} from '../services/posts.js';
import { changePseudonym, emailHash, findUserByPseudonym, toMe } from '../services/users.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const idParams = z.object({ id: z.string().min(10) });

/** Drops undefined values so a partial update never erases a setting. */
function definedEntries<T extends object>(value: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

export const meRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, env, mailer, storage } = app.ctx;

  app.get('/', async (request) => {
    const { user } = request.requireUser();
    return toMe(db, user);
  });

  app.patch('/', { schema: { body: updateMeSchema } }, async (request) => {
    const { user } = request.requireActiveUser();
    const now = new Date();
    if (request.body.pseudonym) await changePseudonym(db, user, request.body.pseudonym, now);
    const patch: Partial<typeof users.$inferInsert> = { updatedAt: now };
    if (request.body.locale) patch.locale = request.body.locale;
    if (request.body.roomLocales) patch.roomLocales = request.body.roomLocales;
    if (request.body.avatar?.startsWith('shape:')) patch.avatar = request.body.avatar;
    if (request.body.settings)
      patch.settings = { ...user.settings, ...definedEntries(request.body.settings) };
    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    if (!updated) throw new ApiError('INTERNAL');
    return toMe(db, updated);
  });

  /** Newest texts from joined rooms, for /today. */
  app.get('/today', async (request) => {
    const { user } = request.requireUser();
    const viewer = await viewerFor(db, user.id);
    return { items: await todayFeed(db, viewer, user.id) };
  });

  /** Texts the member kept for later. */
  app.get('/bookmarks', async (request) => {
    const { user } = request.requireUser();
    const viewer = await viewerFor(db, user.id);
    return { items: await bookmarkedPosts(db, viewer, user.id) };
  });

  app.get('/posts', { schema: { querystring: journalQuerySchema } }, async (request) => {
    const { user } = request.requireUser();
    return journal(db, user.id, request.query);
  });

  app.get('/posts/:id/reactions', { schema: { params: idParams } }, async (request) => {
    const { user } = request.requireUser();
    const post = await requireOwnPost(db, request.params.id, user.id);
    return reactionSummary(db, post);
  });

  /** All feedback lines for /me → Rückmeldungen, newest first, author only. */
  app.get('/feedback', async (request) => {
    const { user } = request.requireUser();
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(eq(posts.authorId, user.id), isNull(posts.deletedAt), eq(posts.visibility, 'public')),
      )
      .orderBy(desc(posts.createdAt))
      .limit(50);
    const anonymous = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.authorId, user.id),
          isNull(posts.deletedAt),
          eq(posts.visibility, 'anonymous'),
        ),
      )
      .orderBy(desc(posts.createdAt))
      .limit(50);
    const all = [...rows, ...anonymous].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const items = [];
    for (const post of all) {
      items.push({
        postId: post.id,
        title: post.title,
        preview:
          (post.body ?? '')
            .split('\n')
            .find((line) => line.trim())
            ?.slice(0, 120) ?? '',
        visibility: post.visibility,
        createdAt: post.createdAt.toISOString(),
        summary: await reactionSummary(db, post),
      });
    }
    return { items };
  });

  app.get('/notices', async (request) => {
    const { user } = request.requireUser();
    const rows = await noticesFor(db, user.id);
    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
        readAt: row.readAt?.toISOString() ?? null,
      })),
    };
  });

  app.get('/sessions', async (request) => {
    const auth = request.requireUser();
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, auth.user.id), isNull(sessions.revokedAt)))
      .orderBy(desc(sessions.lastSeenAt));
    const items: SessionView[] = rows
      .filter((row) => row.expiresAt.getTime() > Date.now())
      .map((row) => ({
        id: row.id,
        device: row.device,
        createdAt: row.createdAt.toISOString(),
        lastSeenAt: row.lastSeenAt.toISOString(),
        current: row.id === auth.sessionId,
      }));
    return { items };
  });

  app.delete('/sessions/:id', { schema: { params: idParams } }, async (request, reply) => {
    const { user } = request.requireUser();
    await revokeSession(db, request.params.id, user.id);
    return reply.status(204).send();
  });

  app.get('/passkeys', async (request) => {
    const { user } = request.requireUser();
    const rows = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.userId, user.id))
      .orderBy(desc(passkeys.createdAt));
    const items: PasskeyView[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    }));
    return { items };
  });

  app.patch(
    '/passkeys/:id',
    { schema: { params: z.object({ id: z.string() }), body: renamePasskeySchema } },
    async (request) => {
      const { user } = request.requireUser();
      await db
        .update(passkeys)
        .set({ name: request.body.name })
        .where(and(eq(passkeys.id, request.params.id), eq(passkeys.userId, user.id)));
      return { ok: true };
    },
  );

  app.delete(
    '/passkeys/:id',
    { schema: { params: z.object({ id: z.string() }) } },
    async (request, reply) => {
      const { user } = request.requireUser();
      await db
        .delete(passkeys)
        .where(and(eq(passkeys.id, request.params.id), eq(passkeys.userId, user.id)));
      return reply.status(204).send();
    },
  );

  app.post('/email/change', { schema: { body: changeEmailSchema } }, async (request, reply) => {
    const { user } = request.requireActiveUser();
    await app.rateLimit(`email-change:${user.id}`, 5, 60 * 60);
    await requestEmailCode(
      db,
      env,
      mailer,
      request.body.email,
      user.locale,
      'change_email',
      user.id,
    );
    return reply.status(202).send({ sent: true });
  });

  app.post(
    '/email/confirm',
    { schema: { body: confirmEmailChangeSchema.extend({ email: changeEmailSchema.shape.email }) } },
    async (request) => {
      const { user } = request.requireActiveUser();
      const { userId } = await consumeEmailCode(
        db,
        env,
        request.body.email,
        request.body.code,
        'change_email',
      );
      if (userId !== user.id) throw new ApiError('CODE_INVALID');
      await db
        .update(users)
        .set({
          email: request.body.email,
          emailHash: emailHash(env.SESSION_SECRET, request.body.email),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      return { ok: true };
    },
  );

  app.post('/avatar', async (request) => {
    const { user } = request.requireActiveUser();
    const file = await request.file();
    if (!file) throw new ApiError('AVATAR_INVALID');
    const buffer = await file.toBuffer();
    if (file.file.truncated) throw new ApiError('AVATAR_TOO_LARGE');
    const normalized = await normalizeAvatar(new Uint8Array(buffer), file.mimetype);
    const version = Date.now().toString(36);
    await storage.put(`avatars/${user.id}.webp`, normalized, 'image/webp');
    const avatar = `upload:${version}`;
    await db.update(users).set({ avatar, updatedAt: new Date() }).where(eq(users.id, user.id));
    return { avatar };
  });

  app.get('/blocks', async (request) => {
    const { user } = request.requireUser();
    const rows = await db
      .select({
        blockedId: blocks.blockedId,
        pseudonym: users.pseudonym,
        createdAt: blocks.createdAt,
      })
      .from(blocks)
      .innerJoin(users, eq(users.id, blocks.blockedId))
      .where(eq(blocks.blockerId, user.id))
      .orderBy(desc(blocks.createdAt));
    // Blocks created from anonymous texts show no pseudonym, so the author stays hidden.
    return {
      items: rows.map((row) => ({
        id: row.blockedId,
        pseudonym: row.pseudonym,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  });

  app.post('/blocks', { schema: { body: blockSchema } }, async (request, reply) => {
    const { user } = request.requireActiveUser();
    let blockedId: string | null = null;
    let revealsPseudonym = true;
    if (request.body.targetType === 'pseudonym') {
      const target = await findUserByPseudonym(db, request.body.targetId);
      blockedId = target?.id ?? null;
    } else if (request.body.targetType === 'post') {
      const [post] = await db
        .select({ authorId: posts.authorId, visibility: posts.visibility })
        .from(posts)
        .where(eq(posts.id, request.body.targetId))
        .limit(1);
      blockedId = post && post.visibility !== 'private' ? post.authorId : null;
      revealsPseudonym = post?.visibility === 'public';
    } else {
      const [comment] = await db
        .select({ authorId: comments.authorId })
        .from(comments)
        .where(eq(comments.id, request.body.targetId))
        .limit(1);
      blockedId = comment?.authorId ?? null;
    }
    if (!blockedId) throw new ApiError('NOT_FOUND');
    if (blockedId === user.id) throw new ApiError('VALIDATION_FAILED', { field: 'targetId' });
    await db.insert(blocks).values({ blockerId: user.id, blockedId }).onConflictDoNothing();
    return reply.status(201).send({ blocked: true, revealsPseudonym });
  });

  app.delete('/blocks/:id', { schema: { params: idParams } }, async (request, reply) => {
    const { user } = request.requireUser();
    await db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, request.params.id)));
    return reply.status(204).send();
  });

  app.delete('/', async (request) => {
    const { user } = request.requireUser();
    const purgeAfter = await scheduleDeletion(db, mailer, user);
    return { scheduledFor: purgeAfter.toISOString() };
  });

  app.post('/deletion/revoke', async (request) => {
    const { user } = request.requireUser();
    if (!user.deletedAt) return { ok: true };
    await revokeDeletion(db, user);
    return { ok: true };
  });

  /** Public profile as others see it. */
  app.get(
    '/profile/:pseudonym',
    { schema: { params: z.object({ pseudonym: z.string() }) } },
    async (request) => {
      const author = await findUserByPseudonym(db, request.params.pseudonym);
      if (!author?.onboardingCompletedAt) throw new ApiError('NOT_FOUND');
      const viewer = await viewerFor(db, request.auth?.user.id ?? null);
      if (viewer.hidden.has(author.id)) throw new ApiError('NOT_FOUND');
      return {
        pseudonym: author.pseudonym,
        avatar: author.avatar,
        memberSince: author.createdAt.toISOString(),
        posts: await profilePosts(db, author, viewer),
      };
    },
  );
};

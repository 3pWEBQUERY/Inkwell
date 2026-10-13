import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { LOCALES, ROOM_KINDS, roomFeedQuerySchema, type Locale } from '@inkwell/shared';

import { roomMembers } from '../db/schema.js';
import { requireRoomBySlug, roomFeed, roomsForUser, viewerFor } from '../services/posts.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const roomRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db } = app.ctx;

  app.get(
    '/',
    {
      schema: {
        querystring: z.object({
          locale: z.string().optional(),
          kind: z.enum(ROOM_KINDS).optional(),
        }),
      },
    },
    async (request) => {
      const userId = request.auth?.user.id ?? null;
      const requested = request.query.locale
        ?.split(',')
        .filter((l): l is Locale => (LOCALES as readonly string[]).includes(l));
      const locales = requested?.length ? requested : (request.auth?.user.roomLocales ?? ['de']);
      return { items: await roomsForUser(db, userId, locales, request.query.kind) };
    },
  );

  app.get('/:slug', { schema: { params: z.object({ slug: z.string() }) } }, async (request) => {
    const room = await requireRoomBySlug(db, request.params.slug);
    const [membership] = request.auth
      ? await db
          .select()
          .from(roomMembers)
          .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, request.auth.user.id)))
          .limit(1)
      : [];
    return {
      id: room.id,
      slug: room.slug,
      kind: room.kind,
      locale: room.locale,
      name: room.name,
      description: room.description,
      rules: room.rules,
      sortDefault: room.sortDefault,
      showHelplines: room.showHelplines,
      joined: Boolean(membership),
      pushEnabled: membership?.pushEnabled ?? false,
    };
  });

  app.get(
    '/:slug/posts',
    { schema: { params: z.object({ slug: z.string() }), querystring: roomFeedQuerySchema } },
    async (request) => {
      const room = await requireRoomBySlug(db, request.params.slug);
      const viewer = await viewerFor(db, request.auth?.user.id ?? null);
      return roomFeed(db, room, viewer, request.query);
    },
  );

  app.post(
    '/:slug/join',
    { schema: { params: z.object({ slug: z.string() }) } },
    async (request) => {
      const { user } = request.requireActiveUser();
      const room = await requireRoomBySlug(db, request.params.slug);
      await db
        .insert(roomMembers)
        .values({ roomId: room.id, userId: user.id })
        .onConflictDoNothing();
      return { joined: true };
    },
  );

  app.post(
    '/:slug/leave',
    { schema: { params: z.object({ slug: z.string() }) } },
    async (request) => {
      const { user } = request.requireUser();
      const room = await requireRoomBySlug(db, request.params.slug);
      await db
        .delete(roomMembers)
        .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, user.id)));
      return { joined: false };
    },
  );

  app.put(
    '/:slug/push',
    {
      schema: { params: z.object({ slug: z.string() }), body: z.object({ enabled: z.boolean() }) },
    },
    async (request) => {
      const { user } = request.requireActiveUser();
      const room = await requireRoomBySlug(db, request.params.slug);
      const rows = await db
        .update(roomMembers)
        .set({ pushEnabled: request.body.enabled })
        .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, user.id)))
        .returning({ pushEnabled: roomMembers.pushEnabled });
      return { pushEnabled: rows[0]?.pushEnabled ?? false };
    },
  );
};

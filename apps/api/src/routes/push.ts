import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { pushSubscriptionSchema } from '@inkwell/shared';

import { pushSubscriptions } from '../db/schema.js';
import { newId } from '../lib/ids.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const pushRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, env } = app.ctx;

  app.get('/vapid', async () => ({ publicKey: env.VAPID_PUBLIC_KEY ?? null }));

  app.post('/', { schema: { body: pushSubscriptionSchema } }, async (request, reply) => {
    const { user } = request.requireActiveUser();
    await db
      .insert(pushSubscriptions)
      .values({
        id: newId(),
        userId: user.id,
        endpoint: request.body.endpoint,
        p256dh: request.body.keys.p256dh,
        auth: request.body.keys.auth,
        platform: 'web',
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: user.id, p256dh: request.body.keys.p256dh, auth: request.body.keys.auth },
      });
    return reply.status(201).send({ ok: true });
  });

  app.delete('/', { schema: { body: z.object({ endpoint: z.url() }) } }, async (request, reply) => {
    const { user } = request.requireUser();
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, request.body.endpoint),
        ),
      );
    return reply.status(204).send();
  });
};

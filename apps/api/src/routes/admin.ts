import { z } from 'zod';

import { moderationActionSchema, queueQuerySchema } from '@inkwell/shared';

import { applyAction, queue } from '../services/moderation.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, mailer } = app.ctx;

  app.get('/queue', { schema: { querystring: queueQuerySchema } }, async (request) => {
    request.requireAdmin();
    return { items: await queue(db, request.query.status) };
  });

  app.post(
    '/flags/:id/action',
    { schema: { params: z.object({ id: z.string() }), body: moderationActionSchema } },
    async (request) => {
      const { user } = request.requireAdmin();
      await applyAction(
        db,
        mailer,
        user,
        request.params.id,
        request.body.action,
        request.body.note,
      );
      return { ok: true };
    },
  );
};

import { createReportSchema } from '@inkwell/shared';

import { createReport } from '../services/moderation.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const reportRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db } = app.ctx;

  app.post('/', { schema: { body: createReportSchema } }, async (request, reply) => {
    const { user } = request.requireUser();
    await app.rateLimit(`reports:${user.id}`, 30, 60 * 60);
    const flag = await createReport(db, user, request.body);
    return reply.status(201).send({ id: flag.id, priority: flag.priority });
  });
};

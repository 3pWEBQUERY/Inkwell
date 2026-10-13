import { z } from 'zod';

import { ApiError } from '../lib/errors.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const mediaRoutes: FastifyPluginAsyncZod = async (app) => {
  const { storage } = app.ctx;

  app.get(
    '/avatars/:userId',
    { schema: { params: z.object({ userId: z.string().min(10) }) } },
    async (request, reply) => {
      const object = await storage.get(`avatars/${request.params.userId}.webp`);
      if (!object) throw new ApiError('NOT_FOUND');
      return reply
        .header('content-type', object.contentType)
        .header('cache-control', 'public, max-age=86400, immutable')
        .send(Buffer.from(object.body));
    },
  );
};

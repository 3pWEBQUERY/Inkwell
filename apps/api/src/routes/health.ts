import { sql } from 'drizzle-orm';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/health', async () => ({ status: 'ok', service: 'api' }));

  app.get('/health/ready', async (_request, reply) => {
    try {
      await app.ctx.db.execute(sql`select 1`);
      return { status: 'ready' };
    } catch {
      return reply.status(503).send({ status: 'degraded', database: 'unreachable' });
    }
  });
};

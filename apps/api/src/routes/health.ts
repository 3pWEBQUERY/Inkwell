import { sql } from 'drizzle-orm';
import { z } from 'zod';

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
  /** Test mailbox for the browser flows: returns the last six-digit code sent to an address. Off unless E2E_MAILBOX=1. */
  app.get(
    '/dev/mailbox',
    { schema: { querystring: z.object({ to: z.email() }) } },
    async (request, reply) => {
      const { env, mailer } = app.ctx;
      if (env.E2E_MAILBOX !== '1' || !mailer.lastTo)
        return reply.status(404).send({ error: 'NOT_FOUND' });
      const mail = mailer.lastTo(request.query.to);
      const code = mail ? /\d{6}/.exec(mail.text)?.[0] : undefined;
      if (!code) return reply.status(404).send({ error: 'NOT_FOUND' });
      return { code };
    },
  );
};

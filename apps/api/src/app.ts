import multipart from '@fastify/multipart';
import Fastify, { type FastifyError } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { LIMITS } from '@inkwell/shared';

import { ApiError } from './lib/errors.js';
import { contextPlugin } from './plugins/context.js';
import { internalAuthPlugin } from './plugins/internal-auth.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { sessionPlugin } from './plugins/session.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { commentRoutes } from './routes/comments.js';
import { exportRoutes } from './routes/exports.js';
import { healthRoutes } from './routes/health.js';
import { jobRoutes } from './routes/jobs.js';
import { meRoutes } from './routes/me.js';
import { mediaRoutes } from './routes/media.js';
import { postRoutes } from './routes/posts.js';
import { pushRoutes } from './routes/push.js';
import { reactionRoutes } from './routes/reactions.js';
import { reportRoutes } from './routes/reports.js';
import { roomRoutes } from './routes/rooms.js';
import { seriesRoutes } from './routes/series.js';
import { voteRoutes } from './routes/votes.js';

import type { AppContext } from './types.js';

function createInstance(ctx: AppContext) {
  return Fastify({
    loggerInstance: ctx.logger,
    trustProxy: true,
    bodyLimit: 1024 * 1024,
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();
}

export type App = ReturnType<typeof createInstance>;

export async function buildApp(ctx: AppContext): Promise<App> {
  const app = createInstance(ctx);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.status).send(error.toBody());
    }
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: 'VALIDATION_FAILED',
        details: {
          issues: error.validation.map((issue) => ({
            path: issue.instancePath,
            message: issue.message,
          })),
        },
      });
    }
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    if (statusCode === 413) return reply.status(413).send({ error: 'PAYLOAD_TOO_LARGE' });
    if (statusCode === 429) return reply.status(429).send({ error: 'RATE_LIMITED' });
    if (statusCode === 404) return reply.status(404).send({ error: 'NOT_FOUND' });
    if (statusCode >= 400 && statusCode < 500)
      return reply.status(statusCode).send({ error: 'VALIDATION_FAILED' });
    request.log.error({ err: error }, 'unhandled error');
    return reply.status(500).send({ error: 'INTERNAL' });
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send({ error: 'NOT_FOUND' }));

  await app.register(contextPlugin, { ctx });
  await app.register(internalAuthPlugin);
  await app.register(sessionPlugin);
  await app.register(rateLimitPlugin);
  await app.register(multipart, { limits: { fileSize: LIMITS.avatarMaxBytes, files: 1 } });

  await app.register(healthRoutes);
  await app.register(
    async (v1) => {
      await v1.register(authRoutes, { prefix: '/auth' });
      await v1.register(roomRoutes, { prefix: '/rooms' });
      await v1.register(postRoutes, { prefix: '/posts' });
      await v1.register(reactionRoutes, { prefix: '/posts' });
      await v1.register(voteRoutes, { prefix: '/posts' });
      await v1.register(commentRoutes, { prefix: '/posts' });
      await v1.register(seriesRoutes, { prefix: '/series' });
      await v1.register(reportRoutes, { prefix: '/reports' });
      await v1.register(meRoutes, { prefix: '/me' });
      await v1.register(exportRoutes, { prefix: '/me/export' });
      await v1.register(pushRoutes, { prefix: '/me/push' });
      await v1.register(mediaRoutes, { prefix: '/media' });
      await v1.register(adminRoutes, { prefix: '/admin' });
      await v1.register(jobRoutes, { prefix: '/jobs' });
    },
    { prefix: '/v1' },
  );

  return app;
}

import { lt, sql } from 'drizzle-orm';

import { emailCodes, rateLimits, webauthnChallenges } from '../db/schema.js';
import { safeEqual } from '../lib/crypto.js';
import { ApiError } from '../lib/errors.js';
import { purgeDeletedAccounts } from '../services/deletion.js';
import { expirePosts } from '../services/expiry.js';
import { expireExports, processPendingExports } from '../services/exports.js';
import { materializeScores } from '../services/ranking.js';

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

/**
 * Background jobs are plain routes triggered by Railway cron with `X-Cron-Secret`.
 * Each is idempotent and safe to run more often than scheduled.
 */
export const jobRoutes: FastifyPluginAsyncZod = async (app) => {
  const { db, env, storage } = app.ctx;

  app.addHook('onRequest', async (request) => {
    const header = request.headers['x-cron-secret'];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token || !safeEqual(token, env.CRON_SECRET))
      throw new ApiError('FORBIDDEN', { reason: 'cron_secret' });
  });

  app.post('/hourly', async () => {
    const now = new Date();
    const expired = await expirePosts(db, now);
    const scored = await materializeScores(db, now);
    const exported = await processPendingExports(db, storage);
    const expiredExports = await expireExports(db, storage, now);
    await db
      .delete(emailCodes)
      .where(lt(emailCodes.expiresAt, new Date(now.getTime() - 86_400_000)));
    await db.delete(webauthnChallenges).where(lt(webauthnChallenges.expiresAt, now));
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, new Date(now.getTime() - 2 * 86_400_000)));
    return { expired, scored, exported, expiredExports };
  });

  app.post('/daily', async () => {
    const purged = await purgeDeletedAccounts(db);
    await db.execute(sql`vacuum (analyze) rate_limits`).catch(() => undefined);
    return { purged };
  });

  /** Exports are processed within minutes, not hours. */
  app.post('/exports', async () => ({ processed: await processPendingExports(db, storage) }));
};

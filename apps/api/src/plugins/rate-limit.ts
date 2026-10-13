import { sql } from 'drizzle-orm';
import fp from 'fastify-plugin';

import { rateLimits } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';

/**
 * Fixed-window counters in Postgres. Enough for the start; the interface stays
 * the same when a Redis-backed implementation replaces it.
 *
 * Keys are per account or per hashed device, never per raw IP (see PRD 10.3).
 */
export const rateLimitPlugin = fp(async (app) => {
  app.decorate('rateLimit', async (key: string, limit: number, windowSeconds: number) => {
    const windowMs = windowSeconds * 1000;
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

    const [row] = await app.ctx.db
      .insert(rateLimits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count });

    if (row && row.count > limit) {
      const retryAfter = Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000);
      throw new ApiError('RATE_LIMITED', { retryAfterSeconds: Math.max(1, retryAfter) });
    }
  });
});

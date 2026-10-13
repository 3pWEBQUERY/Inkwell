import fp from 'fastify-plugin';

import { safeEqual } from '../lib/crypto.js';
import { ApiError } from '../lib/errors.js';

const PUBLIC_PATHS = new Set(['/health', '/health/ready', '/dev/mailbox']);

/**
 * The API is only reachable over the private network, and on top of that every
 * request must carry the shared internal token. Health checks are exempt.
 */
export const internalAuthPlugin = fp(async (app) => {
  app.addHook('onRequest', async (request) => {
    if (PUBLIC_PATHS.has(request.url.split('?')[0] ?? '')) return;
    const header = request.headers['x-internal-token'];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token || !safeEqual(token, app.ctx.env.API_INTERNAL_TOKEN)) {
      throw new ApiError('FORBIDDEN', { reason: 'internal_token' });
    }
  });
});

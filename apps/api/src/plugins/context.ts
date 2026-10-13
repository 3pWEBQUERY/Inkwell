import fp from 'fastify-plugin';

import type { AppContext } from '../types.js';

/** Makes env, database and outbound services available as `app.ctx`. */
export const contextPlugin = fp<{ ctx: AppContext }>(async (app, options) => {
  app.decorate('ctx', options.ctx);
});

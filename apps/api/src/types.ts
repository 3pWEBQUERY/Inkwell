import type { Database } from './db/client.js';
import type { UserRow } from './db/schema.js';
import type { Env } from './env.js';
import type { Mailer } from './lib/mail.js';
import type { PushSender } from './lib/push.js';
import type { Storage } from './lib/storage.js';
import type { Logger } from 'pino';

export interface AppContext {
  env: Env;
  db: Database;
  mailer: Mailer;
  push: PushSender;
  storage: Storage;
  logger: Logger;
}

export interface AuthenticatedUser {
  user: UserRow;
  sessionId: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    ctx: AppContext;
    rateLimit: (key: string, limit: number, windowSeconds: number) => Promise<void>;
  }
  interface FastifyRequest {
    auth: AuthenticatedUser | null;
    /** Hashed device identifier forwarded by the web service; used for rate limits. */
    deviceHash: string | null;
    requireUser: () => AuthenticatedUser;
    requireActiveUser: () => AuthenticatedUser;
    requireAdmin: () => AuthenticatedUser;
  }
}

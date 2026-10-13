import { buildApp } from './app.js';
import { createDatabase } from './db/client.js';
import { loadEnv } from './env.js';
import { createLogger } from './lib/logger.js';
import { createMailer } from './lib/mail.js';
import { createPushSender } from './lib/push.js';
import { createStorage } from './lib/storage.js';

const env = loadEnv();
const logger = createLogger(env);
const { db, close } = createDatabase(env.DATABASE_URL);

const app = await buildApp({
  env,
  db,
  logger,
  mailer: createMailer(env, logger),
  push: createPushSender(env, logger),
  storage: createStorage(env),
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'shutting down');
  await app.close();
  await close();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

await app.listen({ port: env.PORT, host: env.HOST });

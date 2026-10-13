import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp, type App } from '../../src/app.js';
import { createDatabase } from '../../src/db/client.js';
import { loadEnv } from '../../src/env.js';
import { createLogger } from '../../src/lib/logger.js';
import { createMailer } from '../../src/lib/mail.js';
import { createPushSender } from '../../src/lib/push.js';
import { createStorage } from '../../src/lib/storage.js';

/**
 * Runs against a real Postgres (DATABASE_URL) with migrations applied.
 * Exercises the rules that matter most: internal token, error shape, room rules.
 */
const databaseUrl = process.env.DATABASE_URL;
const describeIf = databaseUrl ? describe : describe.skip;

describeIf('api', () => {
  let app: App;
  let close: () => Promise<void>;
  const internal = 'i'.repeat(32);

  beforeAll(async () => {
    const env = loadEnv({
      NODE_ENV: 'test',
      APP_ORIGIN: 'http://localhost:3000',
      RP_ID: 'localhost',
      API_INTERNAL_TOKEN: internal,
      SESSION_SECRET: 's'.repeat(32),
      CRON_SECRET: 'c'.repeat(32),
      DATABASE_URL: databaseUrl,
      MAIL_FROM: 'test <no-reply@example.ch>',
      LOG_LEVEL: 'error',
    });
    const logger = createLogger(env);
    const database = createDatabase(env.DATABASE_URL);
    close = database.close;
    app = await buildApp({
      env,
      db: database.db,
      logger,
      mailer: createMailer(env, logger),
      push: createPushSender(env, logger),
      storage: createStorage(env),
    });
  });

  afterAll(async () => {
    await app.close();
    await close();
  });

  it('answers health without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
  });

  it('refuses requests without the internal token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/rooms' });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'FORBIDDEN', details: { reason: 'internal_token' } });
  });

  it('lists rooms and returns the error shape on validation failures', async () => {
    const rooms = await app.inject({
      method: 'GET',
      url: '/v1/rooms?locale=de',
      headers: { 'x-internal-token': internal },
    });
    expect(rooms.statusCode).toBe(200);
    expect(Array.isArray(rooms.json<{ items: unknown }>().items)).toBe(true);

    const bad = await app.inject({
      method: 'POST',
      url: '/v1/auth/email/code',
      headers: { 'x-internal-token': internal },
      payload: { email: 'not-an-email' },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json<{ error: string }>().error).toBe('VALIDATION_FAILED');
  });

  it('requires a session for writing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      headers: { 'x-internal-token': internal },
      payload: {
        visibility: 'private',
        type: 'thought',
        ciphertext: 'abc',
        nonce: 'n'.repeat(16),
        wrappedKey: 'w'.repeat(24),
      },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'UNAUTHENTICATED' });
  });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp, type App } from '../../src/app.js';
import { createDatabase } from '../../src/db/client.js';
import { loadEnv } from '../../src/env.js';
import { createLogger } from '../../src/lib/logger.js';
import { createPushSender } from '../../src/lib/push.js';
import { createStorage } from '../../src/lib/storage.js';
import { setPassword } from '../../src/services/auth.js';
import { createUser } from '../../src/services/users.js';

import type { Mail } from '../../src/lib/mail.js';

/** The five core flows of the PRD, end to end against Postgres. */
const databaseUrl = process.env.DATABASE_URL;
const describeIf = databaseUrl ? describe : describe.skip;

describeIf('core flows', () => {
  let app: App;
  let close: () => Promise<void>;
  const internal = 'i'.repeat(32);
  const mails: Mail[] = [];
  const headers = (token?: string) => ({
    'x-internal-token': internal,
    'x-locale': 'de',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  });

  async function signIn(email: string, pseudonym: string): Promise<string> {
    const sent = await app.inject({
      method: 'POST',
      url: '/v1/auth/email/code',
      headers: headers(),
      payload: { email },
    });
    expect(sent.statusCode).toBe(202);
    const mail = mails.find((m) => m.to === email);
    const code = /\d{6}/.exec(mail?.text ?? '')?.[0];
    expect(code).toBeDefined();
    const verified = await app.inject({
      method: 'POST',
      url: '/v1/auth/email/verify',
      headers: headers(),
      payload: { email, code },
    });
    expect(verified.statusCode).toBe(200);
    const { token, needsOnboarding } = verified.json<{ token: string; needsOnboarding: boolean }>();
    expect(needsOnboarding).toBe(true);
    const onboarded = await app.inject({
      method: 'POST',
      url: '/v1/auth/onboarding',
      headers: headers(token),
      payload: { ageConfirmed: true, pseudonym, roomLocales: ['de'], locale: 'de' },
    });
    expect(onboarded.statusCode).toBe(200);
    return token;
  }

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
      mailer: {
        async send(mail) {
          mails.push(mail);
        },
      },
      push: createPushSender(env, logger),
      storage: createStorage(env),
    });
  });

  afterAll(async () => {
    await app.close();
    await close();
  });

  const suffix = Date.now().toString(36);
  let authorToken = '';
  let readerToken = '';
  let anonymousPostId = '';

  it('registers two people through magic codes and onboarding', async () => {
    authorToken = await signIn(`author-${suffix}@example.ch`, `stille.birke${suffix.slice(-4)}`);
    readerToken = await signIn(`reader-${suffix}@example.ch`, `leise.amsel${suffix.slice(-4)}`);
    const me = await app.inject({ method: 'GET', url: '/v1/me', headers: headers(authorToken) });
    expect(me.statusCode).toBe(200);
    expect(me.json<{ settings: { defaultVisibility: string } }>().settings.defaultVisibility).toBe(
      'private',
    );
  });

  it('stores a private entry as ciphertext only', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      headers: headers(authorToken),
      payload: {
        visibility: 'private',
        type: 'thought',
        ciphertext: 'Y2lwaGVy',
        nonce: 'bm9uY2Vub25jZW5vbmNl',
        wrappedKey: 'd3JhcHBlZGtleXdyYXBwZWRrZXk',
      },
    });
    expect(created.statusCode).toBe(201);
    const journal = await app.inject({
      method: 'GET',
      url: '/v1/me/posts',
      headers: headers(authorToken),
    });
    const entry = journal.json<{
      items: { body: string | null; ciphertext: string | null; visibility: string }[];
    }>().items[0];
    expect(entry?.visibility).toBe('private');
    expect(entry?.body).toBeNull();
    expect(entry?.ciphertext).toBe('Y2lwaGVy');
  });

  it('shares anonymously in a reflection room and strips the author', async () => {
    const join = await app.inject({
      method: 'POST',
      url: '/v1/rooms/nachts/join',
      headers: headers(authorToken),
    });
    expect(join.statusCode).toBe(200);
    const roomRes = await app.inject({
      method: 'GET',
      url: '/v1/rooms/nachts',
      headers: headers(authorToken),
    });
    const room = roomRes.json<{ id: string }>();

    const tooShort = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      headers: headers(authorToken),
      payload: { visibility: 'anonymous', type: 'thought', body: 'zu kurz', roomId: room.id },
    });
    expect(tooShort.json<{ error: string }>().error).toBe('POST_TOO_SHORT');

    const created = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      headers: headers(authorToken),
      payload: {
        visibility: 'anonymous',
        type: 'thought',
        body: 'Heute Nacht ist es wieder still, und ich schreibe es auf.',
        roomId: room.id,
        expiry: '24h',
      },
    });
    expect(created.statusCode).toBe(201);
    anonymousPostId = created.json<{ id: string }>().id;

    const feed = await app.inject({
      method: 'GET',
      url: '/v1/rooms/nachts/posts',
      headers: headers(readerToken),
    });
    const item = feed
      .json<{ items: { id: string; author: unknown; expiresAt: string | null }[] }>()
      .items.find((p) => p.id === anonymousPostId);
    expect(item).toBeDefined();
    expect(item?.author).toBeNull();
    expect(item?.expiresAt).not.toBeNull();
    expect(JSON.stringify(item)).not.toContain('authorId');
  });

  it('enforces room rules: no anonymous fiction, no votes in reflection rooms', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/rooms/kurzgeschichten/join',
      headers: headers(authorToken),
    });
    const fiction = (
      await app.inject({
        method: 'GET',
        url: '/v1/rooms/kurzgeschichten',
        headers: headers(authorToken),
      })
    ).json<{ id: string }>();
    const anonFiction = await app.inject({
      method: 'POST',
      url: '/v1/posts',
      headers: headers(authorToken),
      payload: {
        visibility: 'anonymous',
        type: 'story',
        title: 'Titel',
        body: 'Eine Geschichte, die lang genug ist, um geteilt zu werden.',
        roomId: fiction.id,
      },
    });
    expect(anonFiction.json<{ error: string }>().error).toBe('ANON_NOT_ALLOWED_IN_ROOM');

    const vote = await app.inject({
      method: 'PUT',
      url: `/v1/posts/${anonymousPostId}/vote`,
      headers: headers(readerToken),
      payload: { value: 1 },
    });
    expect(vote.json<{ error: string }>().error).toBe('VOTING_DISABLED_IN_ROOM');
  });

  it('collects silent reactions the author sees only aggregated', async () => {
    const felt = await app.inject({
      method: 'PUT',
      url: `/v1/posts/${anonymousPostId}/reactions/felt`,
      headers: headers(readerToken),
    });
    expect(felt.statusCode).toBe(204);
    const summary = await app.inject({
      method: 'GET',
      url: `/v1/me/posts/${anonymousPostId}/reactions`,
      headers: headers(authorToken),
    });
    expect(summary.json<{ felt: number; netVotes: number | null }>()).toMatchObject({
      felt: 1,
      netVotes: null,
    });
    const foreign = await app.inject({
      method: 'GET',
      url: `/v1/me/posts/${anonymousPostId}/reactions`,
      headers: headers(readerToken),
    });
    expect(foreign.statusCode).toBe(404);
  });

  it('never widens visibility, and burns for good', async () => {
    const widen = await app.inject({
      method: 'PATCH',
      url: `/v1/posts/${anonymousPostId}`,
      headers: headers(authorToken),
      payload: { visibility: 'public' },
    });
    expect(widen.json<{ error: string }>().error).toBe('VISIBILITY_CANNOT_EXPAND');

    const burned = await app.inject({
      method: 'DELETE',
      url: `/v1/posts/${anonymousPostId}`,
      headers: headers(authorToken),
    });
    expect(burned.statusCode).toBe(204);
    const gone = await app.inject({
      method: 'GET',
      url: `/v1/posts/${anonymousPostId}`,
      headers: headers(readerToken),
    });
    expect(gone.statusCode).toBe(404);
  });

  it('signs in with a password only where one was set by an operator', async () => {
    const email = `ops-${suffix}@example.ch`;
    const password = 'correct horse battery';
    const unknown = await app.inject({
      method: 'POST',
      url: '/v1/auth/password/sign-in',
      headers: headers(),
      payload: { email, password },
    });
    expect(unknown.statusCode).toBe(400);
    expect(unknown.json<{ error: string }>().error).toBe('CREDENTIALS_INVALID');

    const user = await createUser(app.ctx.db, app.ctx.env.SESSION_SECRET, { email, locale: 'de' });
    await setPassword(app.ctx.db, user.id, password);
    const wrong = await app.inject({
      method: 'POST',
      url: '/v1/auth/password/sign-in',
      headers: headers(),
      payload: { email, password: 'not the password' },
    });
    expect(wrong.statusCode).toBe(400);

    const signedIn = await app.inject({
      method: 'POST',
      url: '/v1/auth/password/sign-in',
      headers: headers(),
      payload: { email, password },
    });
    expect(signedIn.statusCode).toBe(200);
    const body = signedIn.json<{ token: string; needsOnboarding: boolean }>();
    expect(body.needsOnboarding).toBe(true);
    const me = await app.inject({ method: 'GET', url: '/v1/me', headers: headers(body.token) });
    expect(me.statusCode).toBe(200);
  });

  it('prepares an export and schedules deletion with a grace period', async () => {
    const requested = await app.inject({
      method: 'POST',
      url: '/v1/me/export',
      headers: headers(authorToken),
    });
    expect(requested.statusCode).toBe(202);
    // The archive is built inline on request; the hourly job only picks up leftovers.
    const job = await app.inject({
      method: 'POST',
      url: '/v1/jobs/exports',
      headers: { ...headers(), 'x-cron-secret': 'c'.repeat(32) },
    });
    expect(job.statusCode, job.body).toBe(200);
    expect(job.json<{ processed: number }>().processed).toBe(0);
    const latest = await app.inject({
      method: 'GET',
      url: '/v1/me/export/latest',
      headers: headers(authorToken),
    });
    expect(latest.json<{ status: string }>().status).toBe('ready');

    const deletion = await app.inject({
      method: 'DELETE',
      url: '/v1/me',
      headers: headers(readerToken),
    });
    expect(deletion.statusCode).toBe(200);
    const afterwards = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: headers(readerToken),
    });
    expect(afterwards.statusCode).toBe(401);
  });
});
